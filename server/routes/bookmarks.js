import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "./auth.js";

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.userId },
      include: { verse: true }
    });
    // Parse JSON fields
    const parsed = bookmarks.map(b => ({
      ...b,
      themes: JSON.parse(b.themes),
      dueDate: Number(b.dueDate),
      lastReviewed: b.lastReviewed ? Number(b.lastReviewed) : null
    }));
    res.json(parsed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", authenticate, async (req, res) => {
  const { reference, text, book, chapter, verse, version } = req.body;
  try {
    let v = await prisma.verse.findUnique({ where: { reference } });
    if (!v) {
      v = await prisma.verse.create({
        data: { reference, text, book, chapter, verse, version }
      });
    }

    const bookmark = await prisma.bookmark.upsert({
      where: {
        userId_verseId: {
          userId: req.userId,
          verseId: v.id
        }
      },
      update: {},
      create: {
        userId: req.userId,
        verseId: v.id,
        dueDate: Date.now()
      },
      include: { verse: true }
    });
    
    res.json({
      ...bookmark,
      themes: JSON.parse(bookmark.themes),
      dueDate: Number(bookmark.dueDate),
      lastReviewed: bookmark.lastReviewed ? Number(bookmark.lastReviewed) : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  if (data.themes && Array.isArray(data.themes)) {
    data.themes = JSON.stringify(data.themes);
  }
  
  try {
    const bookmark = await prisma.bookmark.update({
      where: { id, userId: req.userId },
      data,
      include: { verse: true }
    });
    res.json({
      ...bookmark,
      themes: JSON.parse(bookmark.themes),
      dueDate: Number(bookmark.dueDate),
      lastReviewed: bookmark.lastReviewed ? Number(bookmark.lastReviewed) : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    await prisma.bookmark.delete({
      where: { id: req.params.id, userId: req.userId }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

