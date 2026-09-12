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

router.get("/repair", async (req, res) => {
  try {
    const badVerses = await prisma.verse.findMany({
      where: { text: { contains: "Failed to load text" } }
    });

    let fixed = 0;
    for (const v of badVerses) {
      try {
        const response = await fetch(`https://bible-api.com/${encodeURIComponent(v.reference)}?translation=kjv`);
        if (response.ok) {
          const data = await response.json();
          if (data.text) {
            await prisma.verse.update({
              where: { id: v.id },
              data: { text: data.text.trim() }
            });
            fixed++;
          }
        }
      } catch (err) {
        console.error("Fetch failed for", v.reference);
      }
      // wait 200ms to avoid rate limit
      await new Promise(r => setTimeout(r, 200));
    }
    res.json({ success: true, message: `Repaired ${fixed} out of ${badVerses.length} broken verses!` });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

