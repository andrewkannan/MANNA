import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "./auth.js";

const prisma = new PrismaClient();
const router = express.Router();

// ESP32 fetches the active verse
router.get("/active", async (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId) return res.status(400).json({ error: "Missing deviceId" });

  try {
    const device = await prisma.device.findUnique({
      where: { id: String(deviceId) },
      include: { activeVerse: true }
    });
    
    if (!device) return res.status(404).json({ error: "Device not found." });

    if (device.autoRotate && device.ownerId) {
      const now = new Date();
      const diffMinutes = (now.getTime() - new Date(device.lastRotatedAt).getTime()) / 60000;
      
      if (diffMinutes >= device.rotateInterval) {
        const userBookmarks = await prisma.bookmark.findMany({
          where: { userId: device.ownerId },
          include: { verse: true }
        });
        
        if (userBookmarks.length > 0) {
          const randomIndex = Math.floor(Math.random() * userBookmarks.length);
          const nextBookmark = userBookmarks[randomIndex];
          
          await prisma.device.update({
            where: { id: device.id },
            data: {
              activeVerseId: nextBookmark.verseId,
              lastRotatedAt: now
            }
          });
          
          return res.json(nextBookmark.verse);
        }
      }
    }

    if (device.activeVerse) {
      res.json(device.activeVerse);
    } else {
      res.status(404).json({ error: "No active verse set." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// React app sets the active verse for a device
router.post("/active", authenticate, async (req, res) => {
  const { deviceId, verseId } = req.body;
  if (!deviceId || !verseId) {
    return res.status(400).json({ error: "Missing deviceId or verseId" });
  }
  
  try {
    // Ensure the device belongs to the user
    const device = await prisma.device.findFirst({
      where: { id: deviceId, ownerId: req.userId }
    });
    
    if (!device) return res.status(403).json({ error: "Forbidden" });
    
    await prisma.device.update({
      where: { id: deviceId },
      data: { activeVerseId: verseId }
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Hardware posts an action (e.g. Next button, Master button)
router.post("/action", async (req, res) => {
  const { deviceId, action } = req.body;
  if (!deviceId || !action) return res.status(400).json({ error: "Missing data" });

  try {
    const device = await prisma.device.findUnique({
      where: { id: deviceId }
    });
    if (!device || !device.ownerId) return res.status(403).json({ error: "Forbidden" });

    if (action === "NEXT" || action === "REVIEW") {
      if (action === "REVIEW" && device.activeVerseId) {
        // Find bookmark and update review
        const bookmark = await prisma.bookmark.findUnique({
          where: { userId_verseId: { userId: device.ownerId, verseId: device.activeVerseId } }
        });
        if (bookmark) {
          const today = new Date().toISOString().split('T')[0];
          await prisma.reviewLog.upsert({
            where: { userId_date: { userId: device.ownerId, date: today } },
            update: { count: { increment: 1 } },
            create: { userId: device.ownerId, date: today, count: 1 }
          });
          // Update SRS to GOOD
          await prisma.bookmark.update({
            where: { id: bookmark.id },
            data: { status: 'REVIEW', lastReviewed: Date.now() }
          });
        }
      }

      // Move to next random verse
      const userBookmarks = await prisma.bookmark.findMany({
        where: { userId: device.ownerId },
        include: { verse: true }
      });
      if (userBookmarks.length > 0) {
        const nextBookmark = userBookmarks[Math.floor(Math.random() * userBookmarks.length)];
        await prisma.device.update({
          where: { id: device.id },
          data: {
            activeVerseId: nextBookmark.verseId,
            lastRotatedAt: new Date()
          }
        });
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

