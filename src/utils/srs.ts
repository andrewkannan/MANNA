import type { VerseStatus, ReviewResult, UserVerseData } from '../types';

export const STATUS_ORDER: VerseStatus[] = ['NEW', 'LEARNING', 'REVIEW', 'STRONG', 'MASTERED'];

const INTERVALS = {
  NEW: 0,
  LEARNING: 1, // 1 day
  REVIEW: 3,   // 3 days
  STRONG: 7,   // 7 days
  MASTERED: 14 // 14 days initially, then 30
};

export function calculateNextReview(currentData: UserVerseData, result: ReviewResult): Partial<UserVerseData> {
  let currentIndex = STATUS_ORDER.indexOf(currentData.status);
  let nextStatus = currentData.status;
  let intervalDays = 1;

  const getNextDate = (days: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0); // start of today
    d.setDate(d.getDate() + days);
    return d.getTime();
  };

  switch (result) {
    case 'EASY':
      currentIndex = Math.min(currentIndex + 2, STATUS_ORDER.length - 1);
      nextStatus = STATUS_ORDER[currentIndex];
      intervalDays = nextStatus === 'MASTERED' ? 30 : INTERVALS[nextStatus] * 2;
      break;
    
    case 'GOOD':
      currentIndex = Math.min(currentIndex + 1, STATUS_ORDER.length - 1);
      nextStatus = STATUS_ORDER[currentIndex];
      intervalDays = nextStatus === 'MASTERED' ? (currentData.status === 'MASTERED' ? 30 : 14) : INTERVALS[nextStatus];
      break;
      
    case 'PRACTICE':
      // Stay same level, due tomorrow
      intervalDays = 1;
      break;
      
    case 'DIFFICULT':
      currentIndex = Math.max(currentIndex - 1, 1); // Drop 1 level, but not to NEW
      nextStatus = STATUS_ORDER[currentIndex];
      intervalDays = 1; // Due tomorrow to relearn
      break;
  }

  return {
    status: nextStatus,
    dueDate: getNextDate(intervalDays),
    lastReviewed: Date.now(),
    difficulty: result === 'DIFFICULT' ? currentData.difficulty + 1 : Math.max(0, currentData.difficulty - 1),
    streak: result === 'DIFFICULT' ? 0 : currentData.streak + 1
  };
}
