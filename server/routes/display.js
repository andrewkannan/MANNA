import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "./auth.js";
import path from "path";
import fs from "fs";

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

  // ESP32 fetches the queue of verses (Offline Caching & Smart Dimming)
  router.get("/queue", async (req, res) => {
    const { deviceId } = req.query;
    if (!deviceId) return res.status(400).json({ error: "Missing deviceId" });
  
    try {
      const device = await prisma.device.findUnique({
        where: { id: String(deviceId) },
        include: { activeVerse: true }
      });
      
      if (!device) return res.status(404).json({ error: "Device not found." });
      
      // Get server hour for Smart Dimming
      const serverHour = new Date().getHours();
      
      let queue = [];
      
      // Fetch up to 10 bookmarks for offline caching
      if (device.ownerId) {
         const bookmarks = await prisma.bookmark.findMany({
           where: { userId: device.ownerId },
           include: { verse: true },
           orderBy: { nextReview: 'asc' },
           take: 10
         });
         queue = bookmarks.map(b => b.verse);
      }
      
      // Fallback
      if (queue.length === 0 && device.activeVerse) {
        queue = [device.activeVerse];
      }
      
      if (queue.length === 0) {
        queue = [{ reference: "QUEUE EMPTY", text: "Please bookmark verses in the Web App." }];
      }
      
      res.json({
        serverHour,
        verses: queue
      });
      
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

// OTA Firmware Update Route
router.get("/ota", (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId) return res.status(400).send("Missing deviceId");
  
  // Serve firmware.bin from the project root's 'public' folder
  const firmwarePath = path.join(process.cwd(), 'public', 'firmware.bin');
  
  if (fs.existsSync(firmwarePath)) {
    res.download(firmwarePath, 'firmware.bin');
  } else {
    res.status(404).send("Firmware not found on server.");
  }
});

export default router;
