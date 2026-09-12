import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { ChevronLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { calculateNextReview } from '../utils/srs';
import type { ReviewResult } from '../types';

type Mode = 'STUDY' | 'RECALL' | 'RESULT';

export default function Memorize() {
  const navigate = useNavigate();
  const location = useLocation();
  const singleVerseId = location.state?.singleVerseId;
  
  const [sessionQueue, setSessionQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('STUDY');

  const currentVerseId = sessionQueue[currentIndex];
  const verse = useLiveQuery(() => currentVerseId ? db.bibleVerses.get(currentVerseId) : undefined, [currentVerseId]);
  const userData = useLiveQuery(() => currentVerseId ? db.userData.get(currentVerseId) : undefined, [currentVerseId]);

  useEffect(() => {
    const buildQueue = async () => {
      if (singleVerseId) {
        setSessionQueue([singleVerseId]);
        return;
      }
      const now = Date.now();
      const allDue = await db.userData.filter(v => v.status !== 'NEW' && v.dueDate <= now).limit(10).toArray();
      const newVerses = await db.userData.filter(v => v.status === 'NEW').limit(2).toArray();
      
      const queueIds = [...allDue, ...newVerses].map(v => v.verseId);
      setSessionQueue(queueIds);
    };
    buildQueue();
  }, [singleVerseId]);

  const handleResult = async (result: ReviewResult) => {
    if (userData) {
      const updates = calculateNextReview(userData, result);
      await db.userData.update(userData.verseId, updates);
      
      const appState = await db.appState.get('singleton' as any);
      if (appState) {
        const today = new Date().setHours(0,0,0,0);
        let newStreak = appState.currentStreak;
        if (appState.lastActiveDate !== today) {
           newStreak += 1;
        }
        await db.appState.update('singleton' as any, {
          lastActiveDate: today,
          currentStreak: newStreak,
          longestStreak: Math.max(appState.longestStreak, newStreak)
        });
      }

      if (currentIndex < sessionQueue.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setMode('STUDY');
      } else {
        setSessionQueue([]);
      }
    }
  };

  if (sessionQueue.length === 0 && !singleVerseId) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 text-center bg-[#FDFBF7]">
        <h1 className="text-4xl font-serif mb-4 text-[#2C2825]">Session Complete</h1>
        <p className="font-serif italic opacity-70 mb-12 text-[#4A4541]">Your mind is renewed.</p>
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-[#2C2825] text-[#FDFBF7] font-serif rounded shadow-md hover:bg-[#1A1815] transition-colors">
          Return Home
        </button>
      </div>
    );
  }

  if (sessionQueue.length === 0 && singleVerseId) {
     return <div className="p-6 font-serif text-xl text-center h-full flex items-center justify-center bg-[#FDFBF7]">Done</div>;
  }

  if (!verse || !userData) return <div className="p-6 font-serif text-xl text-center h-full flex items-center justify-center bg-[#FDFBF7]">Loading...</div>;

  return (
    <div className="min-h-full flex flex-col bg-[#F9F6F0] relative overflow-y-auto">
      <header className="sticky top-0 bg-[#F9F6F0]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between z-10 border-b border-[#EAE5D9]">
        <button onClick={() => navigate('/')} className="flex items-center text-[#2C2825] hover:opacity-70 transition-opacity">
          <ChevronLeft size={28} strokeWidth={1.5} className="-ml-2" />
        </button>
        <span className="font-serif text-[#4A4541]">
          {currentIndex + 1} of {sessionQueue.length}
        </span>
      </header>

      <div className="flex-1 p-4 sm:p-6 flex flex-col justify-center items-center">
        {/* The Art Card */}
        <div className="w-full max-w-[420px] bg-[#FDFBF7] shadow-xl rounded-lg overflow-hidden flex flex-col items-center p-6 sm:p-8 border border-[#EAE5D9]">
          {userData.imageUrl && (
            <div className="w-full aspect-[4/5] bg-white p-2 shadow-sm mb-8">
              <div 
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${userData.imageUrl})` }}
              />
            </div>
          )}

          <h2 className="font-serif text-2xl text-[#2C2825] mb-6 text-center">
            {verse.reference}
          </h2>
          
          <div className="min-h-[120px] flex items-center justify-center w-full">
            {mode === 'STUDY' && (
              <p className="font-serif text-[#4A4541] text-center text-[15px] leading-relaxed max-w-[95%]">
                {verse.text}
              </p>
            )}
            
            {mode === 'RECALL' && (
              <p className="font-serif italic text-[#4A4541]/40 text-center text-sm">
                Recall the verse using the image...
              </p>
            )}
            
            {mode === 'RESULT' && (
              <p className="font-serif text-[#4A4541] text-center text-[15px] leading-relaxed max-w-[95%]">
                {verse.text}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-8 w-full max-w-[420px] mx-auto z-10 pt-4">
        {mode === 'STUDY' && (
          <button 
            onClick={() => setMode('RECALL')} 
            className="w-full bg-[#2C2825] text-[#FDFBF7] font-serif text-lg py-4 rounded shadow-md active:scale-[0.98] transition-transform"
          >
            Memorize
          </button>
        )}

        {mode === 'RECALL' && (
          <button 
            onClick={() => setMode('RESULT')} 
            className="w-full bg-white text-[#2C2825] border border-[#2C2825] font-serif text-lg py-4 rounded shadow-sm hover:bg-[#F9F6F0] transition-colors"
          >
            Show Answer
          </button>
        )}
        
        {mode === 'RESULT' && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button onClick={() => handleResult('DIFFICULT')} className="border border-[#8B4513] text-[#8B4513] font-serif py-3 rounded active:bg-[#8B4513] active:text-white transition-colors">
              Difficult
            </button>
            <button onClick={() => handleResult('PRACTICE')} className="border border-[#2C2825] text-[#2C2825] font-serif py-3 rounded active:bg-[#2C2825] active:text-white transition-colors">
              Practice
            </button>
            <button onClick={() => handleResult('GOOD')} className="bg-[#2C2825] text-[#FDFBF7] font-serif py-3 rounded active:scale-[0.95] transition-transform">
              Good
            </button>
            <button onClick={() => handleResult('EASY')} className="bg-[#556B2F] text-[#FDFBF7] font-serif py-3 rounded active:scale-[0.95] transition-transform">
              Easy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
