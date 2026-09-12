import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Search, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Library() {
  const [search, setSearch] = useState('');
  const verses = useLiveQuery(
    () => db.bibleVerses
      .filter(v => v.reference.toLowerCase().includes(search.toLowerCase()) || v.text.toLowerCase().includes(search.toLowerCase()))
      .toArray(),
    [search]
  );

  return (
    <div className="min-h-full pb-24 bg-black text-white">
      <header className="px-6 pt-12 pb-4 sticky top-0 bg-black/90 backdrop-blur-md z-10 border-b border-white/10">
        <h1 className="text-4xl font-sans font-black tracking-tighter mb-6">LIBRARY</h1>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} strokeWidth={2} />
          <input 
            type="text" 
            placeholder="SEARCH..." 
            className="w-full bg-[#111] border border-white/20 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-red-600 font-mono text-sm tracking-widest uppercase placeholder:text-white/30 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <main className="px-6 py-6">
        <div className="space-y-4">
          {verses?.map((verse) => (
            <Link key={verse.id} to={`/verse/${verse.id}`} className="block group">
              <div className="p-5 bg-transparent border border-white/20 rounded-xl group-hover:border-red-600 group-hover:bg-[#111] transition-all">
                <h3 className="font-mono text-[10px] font-bold text-red-500 tracking-[0.2em] uppercase mb-2">{verse.reference}</h3>
                <p className="text-white/80 font-sans text-sm leading-snug line-clamp-2">{verse.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-24 right-6 w-14 h-14 bg-white text-black rounded-full shadow-[4px_4px_0px_0px_rgba(255,0,0,1)] flex items-center justify-center active:translate-y-1 active:translate-x-1 active:shadow-none transition-all z-40">
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
}
