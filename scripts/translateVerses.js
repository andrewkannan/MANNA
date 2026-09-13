import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function run() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("No GEMINI_API_KEY in .env");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const verses = await prisma.verse.findMany({
    where: { tamilText: null }
  });

  console.log(`Found ${verses.length} verses missing Tamil translation.`);

  for (const verse of verses) {
    console.log(`Translating ${verse.reference}...`);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Translate the following Bible verse (${verse.reference}) exactly to the standard Tamil Bible translation (BSI/OVM) without any additional formatting, markdown, or commentary. Only output the Tamil verse text.\n\nVerse: "${verse.text}"`,
      });
      const tamilText = response.text.trim();
      
      await prisma.verse.update({
        where: { id: verse.id },
        data: { tamilText }
      });
      console.log(`  -> Success.`);
      // Add a small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  -> Failed:`, err);
    }
  }

  console.log("Translation complete!");
  process.exit(0);
}

run();
