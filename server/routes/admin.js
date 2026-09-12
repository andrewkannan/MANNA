import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorizeAdmin } from "./auth.js";

const prisma = new PrismaClient();
const router = express.Router();

router.use(authenticate, authorizeAdmin);

router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { bookmarks: true, devices: true } }
      }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/devices", async (req, res) => {
  try {
    const devices = await prisma.device.findMany({
      include: {
        owner: { select: { email: true } }
      }
    });
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

