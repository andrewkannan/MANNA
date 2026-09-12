import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useEffect, useState } from 'react';

export default function TDisplayNothingOS() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const verses = useLiveQuery(() => db.userData.toArray());
  const verseDetails = useLiveQuery(() => db.bibleVerses.toArray());
  const appState = useLiveQuery(() => db.appState.get('singleton' as any));

  useEffect(() => {
    if (appState?.displayVerseId) return;
    
    const interval = setInterval(() => {
      if (verses && verses.length > 0) {
        setCurrentIndex((prev) => (prev + 1) % verses.length);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [verses, appState?.displayVerseId]);

  if (!verses || !verseDetails) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  const lockedUserData = appState?.displayVerseId ? verses.find(v => v.verseId === appState.displayVerseId) : null;
  const activeUserData = lockedUserData || (verses.length > 0 ? verses[currentIndex] : { imageUrl: '/images/olive_tree_path.jpg', verseId: 'mock-123' } as any);
  
  const lockedVerseDetails = appState?.displayVerseId ? verseDetails.find(v => v.id === appState.displayVerseId) : null;
  const activeVerse = lockedVerseDetails || (verses.length > 0 
    ? verseDetails.find(v => v.id === activeUserData?.verseId) 
    : { reference: 'Psalms 23:1-2', text: 'The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters.' });

  if (!activeVerse) return null;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans">
      
      <div className="text-center mb-8 absolute top-10 text-[#666] max-w-md">
        <h2 className="text-xl mb-2 text-white tracking-tight">Nothing OS 5.0 Mockup</h2>
        <p className="text-sm">Brutalist. Monochromatic. High contrast. Dot matrix accents.</p>
      </div>

      {/* T-Display S3 Screen Hardware Box (Landscape: 320x170 pixels) */}
      <div 
        className="relative overflow-hidden shadow-[0_0_50px_rgba(255,0,0,0.15)] border-[10px] border-[#111] rounded-xl flex flex-col justify-center items-center bg-black"
        style={{ width: '320px', height: '170px' }}
      >
        {/* Dot matrix grid background */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ 
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '10px 10px'
          }}
        />

        {/* Dotted World Map Background */}
        <div 
          className="absolute inset-0 bg-contain bg-no-repeat bg-center z-0 opacity-30 grayscale"
          style={{ 
            backgroundImage: `url('/images/world_map.jpg')`,
            backgroundPosition: 'center 20%'
          }}
        />

        {/* Foreground Content */}
        <div className="relative z-10 w-full h-full p-4 flex flex-col items-start justify-center border-l-4 border-red-600">
          
          <div className="w-full flex items-center justify-between absolute top-3 left-0 px-4">
             <h1 className="text-white text-[10px] font-mono font-bold tracking-[0.2em] uppercase bg-black/50 px-1 rounded">
              {activeVerse.reference}
             </h1>
             <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          </div>

          <div className="w-full h-[100px] mt-4 flex items-center pr-2 px-3">
            <p className="text-white text-[13px] leading-snug tracking-tight text-left line-clamp-4 drop-shadow-md bg-black/30 rounded p-1">
              "{activeVerse.text}"
            </p>
          </div>
          
        </div>
      </div>

    </div>
  );
}
