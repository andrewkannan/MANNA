import React from 'react';
import type { UserVerseData, BibleVerse } from '../types';
import { motion } from 'framer-motion';
import { DotMatrixText } from './animations/DotMatrixText';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

interface NothingCardProps {
  verseDetails: BibleVerse;
  userData: UserVerseData;
  isFlipped: boolean;
  onClick: () => void;
}

export default function NothingCard({ verseDetails, userData, isFlipped, onClick }: NothingCardProps) {
  const appState = useLiveQuery(() => db.appState.get('singleton' as any));
  const showTamil = appState?.showTamil;

  return (
    <div 
      className="w-full aspect-[4/5] perspective-1000 cursor-pointer group"
      onClick={onClick}
    >
      <motion.div 
        className="relative w-full h-full preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front of Card (The Visual Hook) */}
        <div className="absolute inset-0 backface-hidden bg-black border-2 border-white/20 p-2 flex flex-col">
          <div className="flex-1 relative overflow-hidden bg-[#111]">
            <div 
              className="absolute inset-0 opacity-40 grayscale contrast-150 bg-cover bg-center"
              style={{ backgroundImage: `url(${userData.imageUrl || '/images/world_map.jpg'})` }}
            />
            {/* Dot pattern overlay */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{ 
                backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1.5px)',
                backgroundSize: '8px 8px'
              }}
            />
            
            <div className="absolute inset-0 flex flex-col justify-between p-6">
              <div className="self-end bg-black border border-white/20 px-2 py-1">
                <span className="font-mono text-white text-[10px] font-bold tracking-[0.2em] uppercase">Visual Hook</span>
              </div>
            </div>
          </div>
          <div className="h-16 flex items-center justify-between px-4 bg-black border-t-2 border-white/20 mt-2">
            <h3 className="font-mono text-white font-bold tracking-[0.2em] uppercase text-sm">{verseDetails.reference}</h3>
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Back of Card (The Text) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-black border-2 border-white/20 p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{ 
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1.5px)',
              backgroundSize: '10px 10px'
            }}
          />
          <h3 className="font-mono text-red-600 font-bold tracking-[0.2em] uppercase text-sm mb-6 relative z-10">{verseDetails.reference}</h3>
          
          <div className="relative z-10 w-full overflow-y-auto no-scrollbar pb-4 text-center">
            <p className="font-sans text-white text-xl leading-relaxed font-medium">
              {isFlipped ? <DotMatrixText text={`"${verseDetails.text}"`} /> : `"${verseDetails.text}"`}
            </p>
            {showTamil && verseDetails.tamilText && (
              <p className="font-sans text-white/50 text-base leading-relaxed font-medium mt-6 pt-6 border-t border-white/10">
                {isFlipped ? <DotMatrixText text={`"${verseDetails.tamilText}"`} /> : `"${verseDetails.tamilText}"`}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
