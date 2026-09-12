export type VerseStatus = 'NEW' | 'LEARNING' | 'REVIEW' | 'STRONG' | 'MASTERED';

export type ReviewResult = 'EASY' | 'GOOD' | 'PRACTICE' | 'DIFFICULT';

export interface BibleVerse {
  id: string; // e.g., "John-3-16"
  book: string;
  chapter: number;
  verse: number;
  reference: string;
  text: string;
  version: string;
}

export interface UserVerseData {
  verseId: string; // foreign key
  status: VerseStatus;
  dueDate: number; // timestamp
  lastReviewed: number | null;
  difficulty: number;
  streak: number;
  tamilExplanation: string;
  personalNotes: string;
  themes: string[];
  categoryId: string | null;
  keyWords?: { word: string; note: string }[];
  crossReferences?: string[];
  imageUrl?: string;
  emojiString?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface AppState {
  id: string;
  lastActiveDate: number | null;
  currentStreak: number;
  longestStreak: number;
  geminiApiKey?: string;
  displayVerseId?: string | null;
  preferredVersion?: string;
}
