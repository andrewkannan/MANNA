import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import displayRoutes from './routes/display.js';
import bibleRoutes from './routes/bible.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
import authRoutes from './routes/auth.js';
import devicesRoutes from './routes/devices.js';

app.use('/api/auth', authRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/display', displayRoutes);
app.use('/api/bible', bibleRoutes);

// Serve static frontend files (when deployed to Railway)
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback to index.html for React Router
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Initialize dummy JSON DB if it doesn't exist
const dbPath = path.join(__dirname, 'data.json');
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ activeVerse: null }), 'utf8');
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
