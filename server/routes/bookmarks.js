import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "./auth.js";
import { GoogleGenAI } from "@google/genai";

const prisma = new PrismaClient();
const router = express.Router();

async function translateVerseToTamil(text, reference) {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate the following Bible verse (${reference}) exactly to the standard Tamil Bible translation (BSI/OVM) without any additional formatting, markdown, or commentary. Only output the Tamil verse text.\n\nVerse: "${text}"`,
    });
    return response.text.trim();
  } catch (err) {
    console.error("Translation error:", err);
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
      const tamilText = await translateVerseToTamil(text, reference);
      v = await prisma.verse.create({
        data: { reference, text, book, chapter, verse, version, tamilText }
      });
    } else if (!v.tamilText) {
      // Background translation if it exists but missing tamil
      translateVerseToTamil(v.text, v.reference).then(tamilText => {
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

export default router;

