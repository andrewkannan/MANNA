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
    
    if (device && device.activeVerse) {
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

export default router;

