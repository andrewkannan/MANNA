import express from 'express';

const router = express.Router();

// Hardcoded book list with chapter counts for standard Protestant Bible
const BOOKS = [
  { name: 'Genesis', chapters: 50 }, { name: 'Exodus', chapters: 40 }, { name: 'Leviticus', chapters: 27 }, { name: 'Numbers', chapters: 36 }, { name: 'Deuteronomy', chapters: 34 },
  { name: 'Joshua', chapters: 24 }, { name: 'Judges', chapters: 21 }, { name: 'Ruth', chapters: 4 }, { name: '1 Samuel', chapters: 31 }, { name: '2 Samuel', chapters: 24 },
  { name: '1 Kings', chapters: 22 }, { name: '2 Kings', chapters: 25 }, { name: '1 Chronicles', chapters: 29 }, { name: '2 Chronicles', chapters: 36 }, { name: 'Ezra', chapters: 10 },
  { name: 'Nehemiah', chapters: 13 }, { name: 'Esther', chapters: 10 }, { name: 'Job', chapters: 42 }, { name: 'Psalms', chapters: 150 }, { name: 'Proverbs', chapters: 31 },
  { name: 'Ecclesiastes', chapters: 12 }, { name: 'Song of Solomon', chapters: 8 }, { name: 'Isaiah', chapters: 66 }, { name: 'Jeremiah', chapters: 52 }, { name: 'Lamentations', chapters: 5 },
  { name: 'Ezekiel', chapters: 48 }, { name: 'Daniel', chapters: 12 }, { name: 'Hosea', chapters: 14 }, { name: 'Joel', chapters: 3 }, { name: 'Amos', chapters: 9 },
  { name: 'Obadiah', chapters: 1 }, { name: 'Jonah', chapters: 4 }, { name: 'Micah', chapters: 7 }, { name: 'Nahum', chapters: 3 }, { name: 'Habakkuk', chapters: 3 },
  { name: 'Zephaniah', chapters: 3 }, { name: 'Haggai', chapters: 2 }, { name: 'Zechariah', chapters: 14 }, { name: 'Malachi', chapters: 4 },
  { name: 'Matthew', chapters: 28 }, { name: 'Mark', chapters: 16 }, { name: 'Luke', chapters: 24 }, { name: 'John', chapters: 21 }, { name: 'Acts', chapters: 28 },
  { name: 'Romans', chapters: 16 }, { name: '1 Corinthians', chapters: 16 }, { name: '2 Corinthians', chapters: 13 }, { name: 'Galatians', chapters: 6 }, { name: 'Ephesians', chapters: 6 },
  { name: 'Philippians', chapters: 4 }, { name: 'Colossians', chapters: 4 }, { name: '1 Thessalonians', chapters: 5 }, { name: '2 Thessalonians', chapters: 3 }, { name: '1 Timothy', chapters: 6 },
  { name: '2 Timothy', chapters: 4 }, { name: 'Titus', chapters: 3 }, { name: 'Philemon', chapters: 1 }, { name: 'Hebrews', chapters: 13 }, { name: 'James', chapters: 5 },
  { name: '1 Peter', chapters: 5 }, { name: '2 Peter', chapters: 3 }, { name: '1 John', chapters: 5 }, { name: '2 John', chapters: 1 }, { name: '3 John', chapters: 1 },
  { name: 'Jude', chapters: 1 }, { name: 'Revelation', chapters: 22 }
];

router.get('/books', (req, res) => {
  res.json(BOOKS);
});

router.get('/chapter', async (req, res) => {
  const { book, chapter } = req.query;
  if (!book || !chapter) return res.status(400).json({ error: 'Missing book or chapter' });

  try {
    const response = await fetch(`https://bible-api.com/${encodeURIComponent(book + ' ' + chapter)}`);
    if (!response.ok) throw new Error(`Bible API returned ${response.status}`);
    const data = await response.json();
    
    const verses = data.verses.map(v => ({
      verse: v.verse,
      text: v.text.trim().replace(/\n/g, ' ')
    }));
    
    res.json(verses);
  } catch (error) {
    console.error('Bible chapter fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch chapter' });
  }
});

router.get('/search', async (req, res) => {
  const { ref } = req.query;
  if (!ref) {
    return res.status(400).json({ error: 'Missing ref parameter' });
  }

  try {
    const response = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}`);
    if (!response.ok) {
      throw new Error(`Bible API returned ${response.status}`);
    }
    const data = await response.json();
    
    // Format response
    res.json({
      reference: data.reference,
      text: data.text.trim().replace(/\n/g, ' ')
    });
  } catch (error) {
    console.error('Bible fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch from Bible API' });
  }
});

export default router;
