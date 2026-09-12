import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev";

router.post("/register", async (req, res) => {
  const { email: rawEmail, password } = req.body;
  if (!rawEmail || !password) return res.status(400).json({ error: "Email and password required" });
  const email = rawEmail.toLowerCase().trim();
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "User already exists" });
    const passwordHash = await bcrypt.hash(password, 10);
    // the first user created can be the admin if needed, but lets just let them be USER.
    // wait, the user asked to have an admin panel. Let us make the very first user an ADMIN automatically.
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "ADMIN" : "USER";

    const user = await prisma.user.create({ data: { email, passwordHash, role } });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email: rawEmail, password } = req.body;
  if (!rawEmail || !password) return res.status(400).json({ error: "Email and password required" });
  const email = rawEmail.toLowerCase().trim();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/seed-152", async (req, res) => {
  const email = req.query.email?.toLowerCase().trim();
  if (!email) return res.status(400).json({ error: "Missing email" });
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // read seed.json
    const seedPath = path.resolve(process.cwd(), "src/db/seed.json");
    if (!fs.existsSync(seedPath)) {
      return res.status(500).json({ error: "seed.json not found" });
    }
    const seedData = JSON.parse(fs.readFileSync(seedPath, "utf-8"));

    let added = 0;
    for (const row of seedData) {
      const reference = row["Bible Reference"];
      const text = row.Text;
      const book = row.Book;
      const chapter = parseInt(row.Chapter);
      const verseNum = parseInt(row["Verse(s)"]);

      // upsert verse
      const verse = await prisma.verse.upsert({
        where: { reference_version: { reference, version: "KJV" } },
        update: {},
        create: {
          reference,
          text,
          book,
          chapter,
          verse: verseNum,
          version: "KJV"
        }
      });

      // custom image url logic from original seedDatabase.ts
      let imageUrl = "https://images.unsplash.com/photo-1448375240586-882707db8855?auto=format&fit=crop&w=800&q=80";
      if (reference.includes("Ephesians 2:8")) imageUrl = "/images/ephesians.jpg";
      if (reference.includes("Joshua 1:9")) imageUrl = "/images/joshua.jpg";
      if (reference.includes("Proverbs 3:5")) imageUrl = "/images/proverbs.jpg";

      // upsert bookmark
      await prisma.bookmark.upsert({
        where: { userId_verseId: { userId: user.id, verseId: verse.id } },
        update: {},
        create: {
          userId: user.id,
          verseId: verse.id,
          status: "NEW",
          dueDate: Date.now(),
          imageUrl
        }
      });
      added++;
    }

    res.json({ success: true, message: `Seeded ${added} verses for ${email}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error", details: error.message + "\n" + error.stack });
  }
});

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const authorizeAdmin = (req, res, next) => {
  if (req.userRole !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  next();
};

export default router;

