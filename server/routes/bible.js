import express from 'express';

const router = express.Router();

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
