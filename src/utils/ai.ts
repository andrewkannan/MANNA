import { GoogleGenAI } from '@google/genai';

export async function generateEmojiString(verseText: string, apiKey: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate the following Bible verse into a sequence of emojis that represent the meaning of the verse. 
      Do not include any text, letters, or numbers. Just emojis. Keep it to a reasonable length (max 10-15 emojis).
      
      Verse: "${verseText}"`,
    });
    
    return response.text ? response.text.trim() : '🤔❓';
  } catch (error) {
    console.error('Failed to generate emojis:', error);
    return '🤔❓'; // Fallback
  }
}
