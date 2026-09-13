import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "./auth.js";

const prisma = new PrismaClient();
const router = express.Router();

async function advanceHardwareQueue(device) {
  if (!device.ownerId) return null;

  const now = Date.now();
  // 1. Prioritize Due verses (max 10)
  const queue = await prisma.bookmark.findMany({
    where: { 
      userId: device.ownerId, 
      status: { not: 'NEW' },
      dueDate: { lte: now }
    },
    orderBy: { dueDate: 'asc' },
    take: 10,
    include: { verse: true }
  });

  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);
  const startOfTodayMs = startOfToday.getTime();

  let next = queue.find(b => !b.lastDisplayedAt || Number(b.lastDisplayedAt) < startOfTodayMs);

  if (!next && queue.length > 0) {
    // Queue is finished for today!
    return "COMPLETE";
  }

  // 2. Fallback to New verses if no due verses exist
  if (!next) {
    const newQueue = await prisma.bookmark.findMany({
      where: { userId: device.ownerId, status: 'NEW' },
      take: 5,
      include: { verse: true }
    });
    
    next = newQueue.find(b => !b.lastDisplayedAt || Number(b.lastDisplayedAt) < startOfTodayMs);
    if (!next && newQueue.length > 0) return "COMPLETE";
  }

  if (!next) return null; // No verses in library

  // Mark as displayed today
  await prisma.bookmark.update({
    where: { id: next.id },
    data: { lastDisplayedAt: Date.now() }
  });

  await prisma.device.update({
    where: { id: device.id },
    data: { activeVerseId: next.verseId, lastRotatedAt: new Date() }
  });

  return next.verse;
}

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

    // If autoRotate is ON, it overrides hardware sequence queue and picks randomly every X minutes.
    // If you want pure SRS Hardware Queue, keep autoRotate OFF.
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
            data: { activeVerseId: nextBookmark.verseId, lastRotatedAt: now }
          });
          
          return res.json(nextBookmark.verse);
        }
      }
    }

    // Hardware sequence fallback (if no active verse, initialize queue)
    if (!device.activeVerse && device.ownerId) {
       const nextVerse = await advanceHardwareQueue(device);
       if (nextVerse === "COMPLETE") {
         return res.json({ reference: "GOAL COMPLETE", text: "You have reviewed all due verses today. Rest well." });
       }
       if (nextVerse) {
         return res.json(nextVerse);
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

router.post("/active", authenticate, async (req, res) => {
  const { deviceId, verseId } = req.body;
  try {
    const device = await prisma.device.findFirst({ where: { id: deviceId, ownerId: req.userId } });
    if (!device) return res.status(403).json({ error: "Forbidden" });
    await prisma.device.update({ where: { id: deviceId }, data: { activeVerseId: verseId } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

router.post("/action", async (req, res) => {
  const { deviceId, action } = req.body;
  if (!deviceId || !action) return res.status(400).json({ error: "Missing data" });

  try {
    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device || !device.ownerId) return res.status(403).json({ error: "Forbidden" });

    if (action === "NEXT" || action === "REVIEW") {
      if (action === "REVIEW" && device.activeVerseId) {
        // Grade bookmark
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
          
          // SRS logic (simplified GOOD score)
          let difficulty = bookmark.difficulty + (8 - 9 * 3) / 10;
          difficulty = Math.max(0.1, Math.min(difficulty, 1.0));
          const streak = bookmark.streak === 0 ? 1 : bookmark.streak * 2;
          const nextInterval = streak * difficulty * 24 * 60 * 60 * 1000;
          
          await prisma.bookmark.update({
            where: { id: bookmark.id },
            data: { 
              status: streak > 5 ? 'MASTERED' : 'REVIEW',
              lastReviewed: Date.now(),
              dueDate: Date.now() + nextInterval,
              difficulty,
              streak
            }
          });
        }
      }

      // Advance queue (for both NEXT and REVIEW)
      const nextVerse = await advanceHardwareQueue(device);
      if (nextVerse === "COMPLETE") {
        // The display will poll GET /active soon, which doesn't know it's complete unless we clear activeVerseId
        // Let's clear it, so GET /active evaluates the queue again and returns GOAL COMPLETE.
        await prisma.device.update({ where: { id: device.id }, data: { activeVerseId: null } });
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
