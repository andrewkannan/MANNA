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

router.get("/seed-full-bible", async (req, res) => {
  try {
    const existing = await prisma.verse.count({ where: { version: "KJV" } });
    if (existing > 1000) {
      return res.status(400).json({ error: "Bible already seeded!" });
    }

    const response = await fetch("https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json");
    const books = await response.json();

    let versesToInsert = [];
    
    for (const book of books) {
      const bookName = book.name;
      for (let c = 0; c < book.chapters.length; c++) {
        const chapterNum = c + 1;
        for (let v = 0; v < book.chapters[c].length; v++) {
          const verseNum = v + 1;
          const text = book.chapters[c][v];
          
          versesToInsert.push({
            reference: `${bookName} ${chapterNum}:${verseNum}`,
            text,
            book: bookName,
            chapter: chapterNum,
            verse: verseNum,
            version: "KJV"
          });
          
          if (versesToInsert.length >= 5000) {
            await prisma.verse.createMany({ data: versesToInsert, skipDuplicates: true });
            versesToInsert = [];
          }
        }
      }
    }
    
    if (versesToInsert.length > 0) {
      await prisma.verse.createMany({ data: versesToInsert, skipDuplicates: true });
    }

    res.json({ success: true, message: "Entire KJV Bible seeded successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

export default router;

