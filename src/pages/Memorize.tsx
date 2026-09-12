import { useState, useEffect } from 'react';
import { calculateNextReview } from '../utils/srs';
import NothingCard from '../components/ArtCard';
import { BrainCircuit, Check, X, RotateCw } from 'lucide-react';
import { useData } from '../store/useData';

export default function Memorize() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const { bookmarks, updateBookmark } = useData();
  const activeBookmarks = bookmarks.filter(b => b.dueDate <= Date.now() || b.status === 'NEW');

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  if (activeBookmarks.length === 0) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 bg-black text-white text-center">
        <BrainCircuit size={48} className="text-white/20 mb-6" strokeWidth={1} />
        <h2 className="text-2xl font-sans font-black tracking-tighter mb-2">MEMORY CORE OPTIMIZED</h2>
        <p className="text-white/50 font-mono text-xs tracking-[0.2em] uppercase max-w-[250px]">No pending verses. Synchronization complete.</p>
      </div>
    );
  }

  const currentBookmark = activeBookmarks[currentIndex];
  const currentVerse = currentBookmark.verse;

  const handleScore = async (score: 1 | 2 | 3 | 4) => {
    let result: 'EASY' | 'GOOD' | 'PRACTICE' | 'DIFFICULT' = 'GOOD';
    if (score === 1) result = 'DIFFICULT';
    if (score === 2) result = 'PRACTICE';
    if (score === 3) result = 'GOOD';
    if (score === 4) result = 'EASY';

    const updates = calculateNextReview(currentBookmark, result);
    await updateBookmark(currentBookmark.id, updates);
    
    // Streaks logic could be moved to backend/user model in the future
    
    if (currentIndex < activeBookmarks.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-full bg-black text-white flex flex-col pb-24">
      <header className="px-6 pt-12 pb-4 flex justify-between items-center border-b border-white/10 sticky top-0 bg-black/90 backdrop-blur-md z-30">
        <div>
          <h1 className="text-3xl font-sans font-black tracking-tighter">RECALL</h1>
          <p className="font-mono text-red-500 text-[10px] tracking-[0.2em] uppercase font-bold mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            Protocol Active
          </p>
        </div>
        <div className="text-right">
          <p className="font-sans font-black text-2xl">{currentIndex + 1}<span className="text-white/30 text-lg">/{activeBookmarks.length}</span></p>
          <p className="font-mono text-white/50 text-[10px] tracking-[0.2em] uppercase">Queue</p>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 flex flex-col justify-center max-w-[400px] mx-auto w-full">
        <NothingCard 
          verseDetails={currentVerse}
          userData={currentBookmark}
          isFlipped={isFlipped}
          onClick={() => setIsFlipped(!isFlipped)}
        />

        <div className={`mt-8 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <p className="text-center font-mono text-white/50 text-[10px] tracking-[0.2em] uppercase mb-4 font-bold">Assess Accuracy</p>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => handleScore(1)} className="flex flex-col items-center justify-center py-4 bg-[#111] border border-white/20 hover:border-red-500 hover:bg-red-500/10 transition-colors">
              <X size={18} className="text-red-500 mb-2" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">Fail</span>
            </button>
            <button onClick={() => handleScore(2)} className="flex flex-col items-center justify-center py-4 bg-[#111] border border-white/20 hover:border-orange-500 hover:bg-orange-500/10 transition-colors">
              <RotateCw size={18} className="text-orange-500 mb-2" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">Hard</span>
            </button>
            <button onClick={() => handleScore(3)} className="flex flex-col items-center justify-center py-4 bg-[#111] border border-white/20 hover:border-blue-500 hover:bg-blue-500/10 transition-colors">
              <Check size={18} className="text-blue-500 mb-2" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">Good</span>
            </button>
            <button onClick={() => handleScore(4)} className="flex flex-col items-center justify-center py-4 bg-[#111] border border-white/20 hover:border-green-500 hover:bg-green-500/10 transition-colors">
              <Check size={18} className="text-green-500 mb-2" strokeWidth={3} />
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">Easy</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
