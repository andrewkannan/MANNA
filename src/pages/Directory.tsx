import { useState, useEffect } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, Folder, Loader2, Plus, Check } from 'lucide-react';

interface Book {
  name: string;
  chapters: number;
}

interface ChapterVerse {
  verse: number;
  text: string;
}

export default function Directory() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<ChapterVerse[]>([]);
  const [loading, setLoading] = useState(false);

  // We need this to check which verses are already in the library
  const libraryVerses = useLiveQuery(() => db.bibleVerses.toArray());
  const libraryRefs = new Set(libraryVerses?.map(v => v.reference) || []);

  const appState = useLiveQuery(() => db.appState.get('singleton' as any));

  useEffect(() => {
    fetch('/api/bible/books')
      .then(res => res.json())
      .then(data => setBooks(data));
  }, []);

  const loadChapter = async (book: string, chapter: number) => {
    setLoading(true);
    setSelectedBook(book);
    setSelectedChapter(chapter);
    try {
      const translation = appState?.preferredVersion || 'web';
      const res = await fetch(`/api/bible/chapter?book=${encodeURIComponent(book)}&chapter=${chapter}&translation=${translation}`);
      const data = await res.json();
      setVerses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addVerse = async (v: ChapterVerse) => {
    const reference = `${selectedBook} ${selectedChapter}:${v.verse}`;
    const id = `verse_${Date.now()}_${v.verse}`;
    await db.bibleVerses.add({
      id,
      reference,
      text: v.text,
      book: selectedBook!,
      chapter: selectedChapter!,
      verse: v.verse,
      version: (appState?.preferredVersion || 'web').toUpperCase()
    });
    await db.userData.add({
      verseId: id,
      status: 'NEW',
      dueDate: Date.now(),
      lastReviewed: null,
      difficulty: 1,
      streak: 0,
      tamilExplanation: '',
      personalNotes: '',
      themes: [],
      categoryId: null,
      imageUrl: '/images/world_map.jpg'
    });
  };

  const goBack = () => {
    if (selectedChapter) {
      setSelectedChapter(null);
      setVerses([]);
    } else if (selectedBook) {
      setSelectedBook(null);
    }
  };

  return (
    <div className="min-h-full pb-24 bg-black text-white font-sans">
      <header className="px-6 pt-12 pb-4 sticky top-0 bg-black/90 backdrop-blur-md z-30 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {selectedBook && (
              <button onClick={goBack} className="text-white/50 hover:text-white transition-colors">
                <ChevronLeft size={20} />
              </button>
            )}
            <p className="font-mono text-red-500 text-[10px] tracking-[0.2em] uppercase font-bold">Data Core</p>
          </div>
          <h1 className="text-3xl font-black tracking-tighter">
            {selectedChapter ? `${selectedBook} ${selectedChapter}` : selectedBook ? selectedBook : 'DIRECTORY'}
          </h1>
        </div>
      </header>

      <main className="px-6 py-6">
        {!selectedBook && (
          <div className="space-y-8">
            <div>
              <h2 className="font-mono text-red-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Old Testament</h2>
              <div className="grid grid-cols-2 gap-3">
                {books.slice(0, 39).map(b => (
                  <button 
                    key={b.name} 
                    onClick={() => setSelectedBook(b.name)}
                    className="bg-[#111] border border-white/10 p-4 text-left hover:border-red-500 transition-colors group relative overflow-hidden"
                  >
                    <Folder size={16} className="text-white/30 mb-3 group-hover:text-red-500 transition-colors" />
                    <h3 className="font-mono text-xs font-bold uppercase tracking-widest truncate">{b.name}</h3>
                    <p className="text-[10px] text-white/50 font-mono">{b.chapters} CH</p>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h2 className="font-mono text-red-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">New Testament</h2>
              <div className="grid grid-cols-2 gap-3">
                {books.slice(39).map(b => (
                  <button 
                    key={b.name} 
                    onClick={() => setSelectedBook(b.name)}
                    className="bg-[#111] border border-white/10 p-4 text-left hover:border-red-500 transition-colors group relative overflow-hidden"
                  >
                    <Folder size={16} className="text-white/30 mb-3 group-hover:text-red-500 transition-colors" />
                    <h3 className="font-mono text-xs font-bold uppercase tracking-widest truncate">{b.name}</h3>
                    <p className="text-[10px] text-white/50 font-mono">{b.chapters} CH</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedBook && !selectedChapter && (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: books.find(b => b.name === selectedBook)?.chapters || 0 }).map((_, i) => (
              <button 
                key={i} 
                onClick={() => loadChapter(selectedBook, i + 1)}
                className="bg-[#111] border border-white/10 aspect-square flex items-center justify-center font-mono font-bold text-lg hover:bg-white hover:text-black transition-colors"
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {selectedChapter && (
          <div className="space-y-4">
            <p className="font-mono text-white/50 text-[10px] tracking-[0.2em] uppercase text-center mb-6">
              Double-tap any verse to bookmark
            </p>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/30">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="font-mono text-[10px] uppercase tracking-widest">Downloading...</p>
              </div>
            ) : (
              verses.map((v) => {
                const ref = `${selectedBook} ${selectedChapter}:${v.verse}`;
                const isAdded = libraryRefs.has(ref);
                
                return (
                  <div 
                    key={v.verse} 
                    onDoubleClick={() => !isAdded && addVerse(v)}
                    className={`p-4 border select-none ${isAdded ? 'border-white/10 bg-black' : 'border-white/20 bg-[#111]'} flex gap-4 relative overflow-hidden`}
                  >
                    <div className="font-mono font-bold text-red-500 text-sm">{v.verse}</div>
                    <div className="flex-1">
                      <p className={`font-sans text-sm leading-relaxed ${isAdded ? 'text-white/40' : 'text-white/90'}`}>{v.text}</p>
                    </div>
                    <button 
                      onClick={() => !isAdded && addVerse(v)}
                      disabled={isAdded}
                      className={`w-10 h-10 shrink-0 flex items-center justify-center border transition-colors ${
                        isAdded 
                          ? 'border-transparent text-green-500' 
                          : 'border-white/20 text-white hover:bg-white hover:text-black hover:border-white'
                      }`}
                    >
                      {isAdded ? <Check size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={2} />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
