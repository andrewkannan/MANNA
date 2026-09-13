import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "./auth.js";
import { GoogleGenAI } from "@google/genai";

const prisma = new PrismaClient();
const router = express.Router();

async function translateVerseToTamil(text, reference, book, chapter, verseNum) {
  try {
    // book e.g. "Genesis", chapter e.g. 1, verse e.g. 1
    const encodedBook = encodeURIComponent(book);
    const url = `https://raw.githubusercontent.com/aruljohn/Bible-tamil/main/${encodedBook}.json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    
    const chapterData = data.chapters.find(c => String(c.chapter) === String(chapter));
    if (!chapterData) return null;
    
    const verseData = chapterData.verses.find(v => String(v.verse) === String(verseNum));
    if (!verseData) return null;
    
    return verseData.text;
  } catch (err) {
    console.error("Translation fetch error:", err);
    return null;
  }
}

router.get("/heatmap", authenticate, async (req, res) => {
  try {
    const logs = await prisma.reviewLog.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'asc' }
    });
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

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
    let v = await prisma.verse.findUnique({ where: { reference_version: { reference, version } } });
    if (!v) {
      const tamilText = await translateVerseToTamil(text, reference, book, chapter, verse);
      v = await prisma.verse.create({
        data: { reference, text, book, chapter, verse, version, tamilText }
      });
    } else if (!v.tamilText) {
      // Background translation if it exists but missing tamil
      translateVerseToTamil(v.text, v.reference, v.book, v.chapter, v.verse).then(tamilText => {
        if (tamilText) {
          prisma.verse.update({ where: { id: v.id }, data: { tamilText } }).catch(console.error);
        }
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
    const bm = await prisma.bookmark.findUnique({ where: { id } });
    if (!bm || bm.userId !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const bookmark = await prisma.bookmark.update({
      where: { id },
      data,
      include: { verse: true }
    });

    if (data.lastReviewed) {
      const today = new Date().toISOString().split('T')[0];
      await prisma.reviewLog.upsert({
        where: { userId_date: { userId: req.userId, date: today } },
        update: { count: { increment: 1 } },
        create: { userId: req.userId, date: today, count: 1 }
      });
    }

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
    const bm = await prisma.bookmark.findUnique({ where: { id: req.params.id } });
    if (!bm || bm.userId !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    await prisma.bookmark.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/translate-all", authenticate, async (req, res) => {
  res.json({ message: "Sync started in background" });
  
  try {
    const verses = await prisma.verse.findMany({ where: { tamilText: null } });
    for (const verse of verses) {
      try {
        const tamilText = await translateVerseToTamil(verse.text, verse.reference, verse.book, verse.chapter, verse.verse);
        if (tamilText) {
          await prisma.verse.update({
            where: { id: verse.id },
            data: { tamilText }
          });
        }
        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        console.error("Translation fail:", e);
      }
    }
  } catch (err) {
    console.error(err);
  }
});

export default router;

