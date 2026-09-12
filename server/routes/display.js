import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../data.json');

// Helper to read DB
const readDB = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { activeVerse: null };
  }
};

// Helper to write DB
const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
};

// ESP32 fetches the active verse
router.get('/active', (req, res) => {
  const db = readDB();
  if (db.activeVerse) {
    res.json(db.activeVerse);
  } else {
    res.status(404).json({ error: 'No active verse set.' });
  }
});

// React app sets the active verse
router.post('/active', (req, res) => {
  const { id, reference, text, imageUrl } = req.body;
  if (!reference || !text) {
    return res.status(400).json({ error: 'Missing verse data' });
  }
  
  const db = readDB();
  db.activeVerse = {
    id,
    reference,
    text,
    imageUrl: imageUrl || '/images/world_map.jpg'
  };
  
  writeDB(db);
  res.json({ success: true, activeVerse: db.activeVerse });
});

export default router;
