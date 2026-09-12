import { db } from './db';
import seedData from './seed.json';
import type { VerseStatus } from '../types';

export async function initializeDatabase() {
  const count = await db.bibleVerses.count();
  if (count > 0) {
    return; // Already seeded
  }

  console.log("Seeding initial database...");
  const versesToInsert = seedData.map((row: any) => ({
    id: `${row.Book.replace(/\s+/g, '-')}-${row.Chapter}-${row['Verse(s)']}`,
    book: row.Book,
    chapter: row.Chapter,
    verse: row['Verse(s)'],
    reference: row['Bible Reference'],
    text: row.Text,
    version: 'KJV'
  }));

  await db.bibleVerses.bulkAdd(versesToInsert);

  const userDataToInsert = versesToInsert.map((verse, index) => {
    let imageUrl = 'https://images.unsplash.com/photo-1448375240586-882707db8855?auto=format&fit=crop&w=800&q=80'; // fallback
    
    if (verse.reference.includes('Ephesians 2:8')) imageUrl = '/images/ephesians.jpg';
    if (verse.reference.includes('Joshua 1:9')) imageUrl = '/images/joshua.jpg';
    if (verse.reference.includes('Proverbs 3:5')) imageUrl = '/images/proverbs.jpg';
    
    return {
      verseId: verse.id,
      status: 'NEW' as VerseStatus,
      dueDate: Date.now(),
      lastReviewed: null,
      difficulty: 0,
      streak: 0,
      tamilExplanation: '',
      personalNotes: '',
      themes: [],
      categoryId: null,
      imageUrl
    };
  });

  await db.userData.bulkAdd(userDataToInsert);
  
  await db.appState.add({
    id: 'singleton' as any,
    lastActiveDate: null,
    currentStreak: 0,
    longestStreak: 0
  });

  console.log("Database seeded successfully.");
}
