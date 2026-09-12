import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Monitor, Search } from 'lucide-react';
import { useState } from 'react';

export default function DisplayControl() {
  const appState = useLiveQuery(() => db.appState.get('singleton' as any));
  const libraryVerses = useLiveQuery(() => db.bibleVerses.toArray());
  const userData = useLiveQuery(() => db.userData.toArray());
  const [search, setSearch] = useState('');

  const handleSetDisplay = async (verseId: string) => {
    if (appState) {
      await db.appState.update('singleton' as any, { displayVerseId: verseId });
      
      // Sync with server for the hardware display
      const verse = libraryVerses?.find(v => v.id === verseId);
      const uData = userData?.find(v => v.verseId === verseId);
      
      if (verse) {
        try {
          await fetch('/api/display/active', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: verse.id,
              reference: verse.reference,
              text: verse.text,
              imageUrl: uData?.imageUrl || '/images/world_map.jpg'
            })
          });
        } catch (err) {
          console.error("Failed to sync with display server:", err);
        }
      }
    }
  };

  const filteredVerses = libraryVerses?.filter(v => 
    v.reference.toLowerCase().includes(search.toLowerCase()) || 
    v.text.toLowerCase().includes(search.toLowerCase())
  );

  const activeVerse = libraryVerses?.find(v => v.id === appState?.displayVerseId);
  const activeUserData = userData?.find(v => v.verseId === appState?.displayVerseId);

  return (
    <div className="min-h-full pb-24 bg-black text-white">
      <header className="px-6 pt-12 pb-6 border-b border-white/10">
        <h1 className="text-4xl font-sans font-black tracking-tighter">DISPLAY</h1>
        <p className="font-mono text-red-600 text-[10px] tracking-[0.2em] uppercase mt-1 font-bold">Hardware Sync</p>
      </header>

      <main className="px-6 py-6">
        <h2 className="font-mono text-white/50 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Active Feed</h2>
        
        {activeVerse ? (
          <div className="bg-transparent border border-white/20 rounded-2xl overflow-hidden mb-8 group relative">
            <div 
              className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none transition-transform group-hover:scale-110 z-0"
              style={{ 
                backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1.5px)',
                backgroundSize: '10px 10px'
              }}
            />
            <div 
              className="h-32 w-full bg-cover bg-center relative grayscale contrast-150 opacity-30 z-10"
              style={{ backgroundImage: `url(${activeUserData?.imageUrl || '/images/world_map.jpg'})` }}
            >
              <div className="absolute inset-0 bg-black/50" />
            </div>
            
            <div className="absolute top-[30px] left-0 w-full px-6 z-20">
                <p className="text-white font-sans font-bold leading-snug line-clamp-3 text-sm text-left">
                  "{activeVerse.text}"
                </p>
            </div>

            <div className="p-4 flex flex-col gap-4 border-t border-white/10 bg-[#0a0a0a] relative z-20">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                <span className="font-mono text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase">{activeVerse.reference}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => window.open('/t-display', '_blank')}
                  className="flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white bg-transparent hover:bg-white/5 border border-white/20 py-3 rounded-lg transition-colors"
                >
                  <Monitor size={14} /> Classic
                </button>
                <button 
                  onClick={() => window.open('/t-display-nothing', '_blank')}
                  className="flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-black bg-white hover:bg-white/80 py-3 rounded-lg transition-colors"
                >
                  <Monitor size={14} /> OS 5.0
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-transparent border border-white/20 border-dashed rounded-xl p-8 mb-8 text-center">
            <Monitor className="mx-auto text-white/30 mb-3" size={32} strokeWidth={1.5} />
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/50 font-bold">NO FEED SELECTED</p>
          </div>
        )}

        <h2 className="font-mono text-white/50 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Library Feed</h2>
        
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={16} strokeWidth={2} />
          <input 
            type="text" 
            placeholder="SEARCH..." 
            className="w-full bg-[#111] border border-white/20 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-red-600 font-mono text-xs tracking-widest uppercase transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-3 h-[300px] overflow-y-auto pr-2 pb-10">
          {filteredVerses?.map((verse) => (
            <div 
              key={verse.id} 
              onClick={() => handleSetDisplay(verse.id)}
              className={`p-4 border rounded-xl cursor-pointer transition-all ${
                appState?.displayVerseId === verse.id 
                  ? 'bg-[#111] border-red-600' 
                  : 'bg-transparent border-white/10 hover:border-white/30'
              }`}
            >
              <h3 className="font-mono text-[10px] text-red-500 font-bold tracking-[0.2em] uppercase mb-1">{verse.reference}</h3>
              <p className="text-white/80 font-sans text-xs line-clamp-1">{verse.text}</p>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
