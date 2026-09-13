import Dexie, { type EntityTable } from 'dexie';
import type { BibleVerse, UserVerseData, Category, AppState } from '../types';

const db = new Dexie('WordAndRememberDB') as Dexie & {
  bibleVerses: EntityTable<BibleVerse, 'id'>;
  userData: EntityTable<UserVerseData, 'verseId'>;
  categories: EntityTable<Category, 'id'>;
  appState: EntityTable<AppState, 'id'>;
};

// Schema declaration
db.version(2).stores({
  bibleVerses: 'id, book, reference',
  userData: 'verseId, status, dueDate, categoryId',
  categories: 'id, name',
  appState: 'id' // 'id' will just be 'singleton'
});

// Initialize default state
db.on('populate', () => {
  db.appState.add({
    id: 'singleton',
    lastActiveDate: null,
    currentStreak: 0,
    longestStreak: 0,
    showTamil: false,
    preferredVersion: 'web'
  });
});

export { db };
