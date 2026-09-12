import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useEffect, useState } from 'react';

export default function TDisplayPreview() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const verses = useLiveQuery(() => db.userData.toArray());
  const verseDetails = useLiveQuery(() => db.bibleVerses.toArray());
  const appState = useLiveQuery(() => db.appState.get('singleton' as any));

  useEffect(() => {
    if (appState?.displayVerseId) return; // Stop auto-rotation if a specific verse is locked
    
    // Auto-rotate verses every 10 seconds to simulate a live display
    const interval = setInterval(() => {
      if (verses && verses.length > 0) {
        setCurrentIndex((prev) => (prev + 1) % verses.length);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [verses, appState?.displayVerseId]);

  if (!verses || !verseDetails) {
    return <div className="min-h-screen bg-[#111] flex items-center justify-center text-white font-serif">Loading...</div>;
  }

  // Use locked verse if set, otherwise rotate, otherwise fallback
  const lockedUserData = appState?.displayVerseId ? verses.find(v => v.verseId === appState.displayVerseId) : null;
  const activeUserData = lockedUserData || (verses.length > 0 ? verses[currentIndex] : { imageUrl: '/images/olive_tree_path.jpg', verseId: 'mock-123' } as any);
  
  const lockedVerseDetails = appState?.displayVerseId ? verseDetails.find(v => v.id === appState.displayVerseId) : null;
  const activeVerse = lockedVerseDetails || (verses.length > 0 
    ? verseDetails.find(v => v.id === activeUserData?.verseId) 
    : { reference: 'Psalms 23:1-2', text: 'The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters.' });

  if (!activeVerse) return null;

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center p-4">
      
      <div className="text-center mb-8 absolute top-10 text-[#888] font-serif max-w-md">
        <h2 className="text-xl mb-2 text-white">LilyGO T-Display-S3 Mockup</h2>
        <p className="text-sm">This uses a custom AI-generated classical watercolor background, heavily faded to prioritize text readability.</p>
      </div>

      {/* T-Display S3 Screen Hardware Box (Landscape: 320x170 pixels) */}
      <div 
        className="relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-[10px] border-[#222] rounded-xl flex flex-col justify-center items-center"
        style={{ width: '320px', height: '170px' }}
      >
        {/* Full Screen Faded Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ 
            backgroundImage: `url(${activeUserData.imageUrl || '/images/olive_tree_path.jpg'})`,
          }}
        >
          {/* Dark overlay to ensure text legibility */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
        </div>

        {/* Foreground Content (Z-10) */}
        <div className="relative z-10 w-full h-full p-4 flex flex-col items-center">
          
          {/* Main Verse Text - Centered exactly in the available space above the reference */}
          <div className="absolute top-0 left-0 w-full h-[135px] flex items-center justify-center px-4">
            <p className="text-[#FDFBF7] font-serif text-[14px] leading-relaxed text-center drop-shadow-md line-clamp-5">
              "{activeVerse.text}"
            </p>
          </div>

          {/* Reference - Fixed at the absolute bottom right */}
          <div className="absolute bottom-3 right-4">
            <h1 className="text-[#EAE5D9] font-serif text-[11px] font-bold tracking-widest uppercase opacity-80 drop-shadow-md">
              {activeVerse.reference}
            </h1>
          </div>
          
        </div>
      </div>

    </div>
  );
}
