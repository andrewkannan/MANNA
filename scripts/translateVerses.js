import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const verses = await prisma.verse.findMany({
    where: { tamilText: null }
  });

  console.log(`Found ${verses.length} verses missing Tamil text.`);

  for (const verse of verses) {
    console.log(`Fetching ${verse.reference}...`);
    try {
      const encodedBook = encodeURIComponent(verse.book);
      const url = `https://raw.githubusercontent.com/aruljohn/Bible-tamil/main/${encodedBook}.json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch JSON for ${verse.book}`);
      
      const data = await res.json();
      const chapterData = data.chapters.find((c: any) => String(c.chapter) === String(verse.chapter));
      if (!chapterData) throw new Error("Chapter not found");
      
      const verseData = chapterData.verses.find((v: any) => String(v.verse) === String(verse.verse));
      if (!verseData) throw new Error("Verse not found");
      
      const tamilText = verseData.text;
      
      await prisma.verse.update({
        where: { id: verse.id },
        data: { tamilText }
      });
      console.log(`  -> Success.`);
      
      await new Promise(r => setTimeout(r, 200));
    } catch (err: any) {
      console.error(`  -> Failed: ${err.message}`);
    }
  }

  console.log("Sync complete!");
  process.exit(0);
}

run();
