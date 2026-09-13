import { useState, useEffect } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, Folder, Loader2, Plus, Minus, Search, X } from 'lucide-react';

interface Book {
  name: string;
  chapters: number;
}

interface ChapterVerse {
  verse: number;
  text: string;
  reference?: string;
  book?: string;
  chapter?: number;
}

import { useData } from '../store/useData';
import { redLetterVerses } from '../utils/redLetters';
import { PageWrapper } from '../components/animations/PageWrapper';
import { StaggerList } from '../components/animations/StaggerList';
import { Marquee } from '../components/animations/Marquee';
import { motion } from 'framer-motion';

export default function Directory() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<ChapterVerse[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChapterVerse[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { bookmarks, addBookmark, deleteBookmark } = useData();
  const libraryRefs = new Map(bookmarks.map(b => [b.verse.reference, b.id]));

  const appState = useLiveQuery(() => db.appState.get('singleton' as any));

  useEffect(() => {
    fetch('/api/bible/books')
      .then(res => res.json())
      .then(data => setBooks(data));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/bible/search-text?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

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

  const toggleVerse = async (v: ChapterVerse, bookmarkId: string | undefined) => {
    if (bookmarkId) {
      await deleteBookmark(bookmarkId);
    } else {
      const book = v.book || selectedBook!;
      const chapter = v.chapter || selectedChapter!;
      const reference = v.reference || `${book} ${chapter}:${v.verse}`;
      await addBookmark({
        reference,
        text: v.text,
        book,
        chapter,
        verse: v.verse,
        version: "KJV"
      });
    }
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
    <PageWrapper className="pb-24 bg-black text-white font-sans">
      <header className="px-6 pt-12 pb-4 sticky top-0 bg-black/90 backdrop-blur-md z-30 border-b border-white/10 flex flex-col gap-4">
        {!selectedBook && <Marquee text="MANNA OS // MEMORY PROTOCOL ACTIVE // DIRECTORY ONLINE //" className="absolute top-0 left-0 right-0 w-full" />}
        <div className={`flex items-center justify-between ${!selectedBook ? 'mt-4' : ''}`}>
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
        </div>

        {!selectedBook && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={16} strokeWidth={2} />
            <input 
              type="text" 
              placeholder="GLOBAL SEARCH (KJV)..." 
              className="w-full bg-[#111] border border-white/20 rounded-xl py-3 pl-12 pr-10 focus:outline-none focus:border-red-600 font-mono text-xs tracking-widest uppercase placeholder:text-white/30 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </header>

      <main className="px-6 py-6">
        {!selectedBook && searchQuery && (
          <div className="space-y-4">
            {isSearching ? (
              <div className="text-center py-10 font-mono text-xs uppercase tracking-widest text-white/50">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-10 font-mono text-xs uppercase tracking-widest text-white/50">No results found</div>
            ) : (
              searchResults.map((v) => {
                const ref = v.reference!;
                const bookmarkId = libraryRefs.get(ref);
                const isAdded = !!bookmarkId;
                const isRedLetter = redLetterVerses.has(ref);
                
                return (
                  <div 
                    key={ref} 
                    onDoubleClick={() => toggleVerse(v, bookmarkId)}
                    className={`p-4 border select-none transition-colors ${isAdded ? 'border-red-500 bg-red-950/20' : 'border-white/20 bg-[#111]'} flex flex-col gap-2 relative overflow-hidden`}
                  >
                    <div className="font-mono font-bold text-red-500 text-xs tracking-widest">{ref}</div>
                    <p className={`font-sans text-sm leading-relaxed ${isRedLetter ? 'text-red-500 font-bold' : (isAdded ? 'text-white font-bold' : 'text-white/90')}`}>{v.text}</p>
                  </div>
                );
              })
            )}
          </div>
        )}        {!selectedBook && !searchQuery && (
          <div className="space-y-8">
            <div>
              <h2 className="font-mono text-red-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Old Testament</h2>
              <StaggerList className="grid grid-cols-2 gap-3">
                {books.slice(0, 39).map(b => (
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    key={b.name} 
                    onClick={() => setSelectedBook(b.name)}
                    className="bg-[#111] border border-white/10 p-4 text-left hover:border-red-500 transition-colors group relative overflow-hidden block w-full"
                  >
                    <Folder size={16} className="text-white/30 mb-3 group-hover:text-red-500 transition-colors" />
                    <h3 className="font-mono text-xs font-bold uppercase tracking-widest truncate">{b.name}</h3>
                    <p className="text-[10px] text-white/50 font-mono">{b.chapters} CH</p>
                  </motion.button>
                ))}
              </StaggerList>
            </div>
            
            <div>
              <h2 className="font-mono text-red-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">New Testament</h2>
              <StaggerList className="grid grid-cols-2 gap-3">
                {books.slice(39).map(b => (
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    key={b.name} 
                    onClick={() => setSelectedBook(b.name)}
                    className="bg-[#111] border border-white/10 p-4 text-left hover:border-red-500 transition-colors group relative overflow-hidden block w-full"
                  >
                    <Folder size={16} className="text-white/30 mb-3 group-hover:text-red-500 transition-colors" />
                    <h3 className="font-mono text-xs font-bold uppercase tracking-widest truncate">{b.name}</h3>
                    <p className="text-[10px] text-white/50 font-mono">{b.chapters} CH</p>
                  </motion.button>
                ))}
              </StaggerList>
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
              Double-tap any verse to toggle bookmark
            </p>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/30">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="font-mono text-[10px] uppercase tracking-widest">Downloading...</p>
              </div>
            ) : (
              verses.map((v) => {
                const ref = `${selectedBook} ${selectedChapter}:${v.verse}`;
                const bookmarkId = libraryRefs.get(ref);
                const isAdded = !!bookmarkId;
                const isRedLetter = redLetterVerses.has(ref);
                
                return (
                  <div 
                    key={v.verse} 
                    onDoubleClick={() => toggleVerse(v, bookmarkId)}
                    className={`p-4 border select-none transition-colors ${isAdded ? 'border-red-500 bg-red-950/20' : 'border-white/20 bg-[#111]'} flex gap-4 relative overflow-hidden`}
                  >
                    <div className="font-mono font-bold text-red-500 text-sm">{v.verse}</div>
                    <div className="flex-1">
                      <p className={`font-sans text-sm leading-relaxed ${isRedLetter ? 'text-red-500 font-bold' : (isAdded ? 'text-white font-bold' : 'text-white/90')}`}>{v.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </PageWrapper>
  );
}
