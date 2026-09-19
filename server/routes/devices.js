import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "./auth.js";

const prisma = new PrismaClient();
const router = express.Router();

// Generate random 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Hardware calls this to get a pairing code
router.post("/register-hardware", async (req, res) => {
  const { macAddress } = req.body;
  try {
    let device = await prisma.device.findUnique({ where: { macAddress } });
    if (!device) {
      device = await prisma.device.create({
        data: {
          macAddress,
          pairingCode: generateCode(),
        }
      });
    } else if (device.ownerId) {
      return res.json({ status: "paired", deviceId: device.id, ownerId: device.ownerId });
    } else if (!device.pairingCode) {
      device = await prisma.device.update({
        where: { id: device.id },
        data: { pairingCode: generateCode() }
      });
    }
    res.json({ status: "pairing", pairingCode: device.pairingCode });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// User calls this to claim a device via pairing code
router.post("/claim", authenticate, async (req, res) => {
  const { pairingCode, name } = req.body;
  try {
    const device = await prisma.device.findFirst({ where: { pairingCode } });
    if (!device) return res.status(400).json({ error: "Invalid pairing code" });
    if (device.ownerId) return res.status(400).json({ error: "Device already claimed" });
    
    await prisma.device.update({
      where: { id: device.id },
      data: {
        ownerId: req.userId,
        pairingCode: null, // clear code after claiming
        name: name || "T-Display-S3"
      }
    });
    res.json({ success: true, message: "Device successfully claimed!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// User lists their devices
router.get("/", authenticate, async (req, res) => {
  try {
    const devices = await prisma.device.findMany({ where: { ownerId: req.userId } });
    res.json(devices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update device config (auto-rotate)
router.patch("/:id/config", authenticate, async (req, res) => {
  const { autoRotate, rotateInterval } = req.body;
  try {
    const device = await prisma.device.findFirst({
      where: { id: req.params.id, ownerId: req.userId }
    });
    if (!device) return res.status(403).json({ error: "Forbidden" });
    
    await prisma.device.update({
      where: { id: device.id },
      data: {
        autoRotate: autoRotate !== undefined ? autoRotate : device.autoRotate,
        rotateInterval: rotateInterval !== undefined ? rotateInterval : device.rotateInterval
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Unlink a device
router.post("/unlink/:id", authenticate, async (req, res) => {
  try {
    await prisma.device.updateMany({
      where: { id: req.params.id, ownerId: req.userId },
      data: { ownerId: null, pairingCode: generateCode() }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

