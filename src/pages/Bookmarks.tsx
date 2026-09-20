import { useState } from 'react';
import { Search, Plus, CloudDownload, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../store/useData';
import { redLetterVerses } from '../utils/redLetters';
import { PageWrapper } from '../components/animations/PageWrapper';
import { StaggerList } from '../components/animations/StaggerList';
import { motion } from 'framer-motion';
import EmptyState from '../components/EmptyState';

import { toast } from 'sonner';

import { Trash2 } from 'lucide-react';

const SwipeableItem = ({ children, onDelete }: { children: React.ReactNode, onDelete: () => void }) => {
  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-red-900 border border-red-900">
      <div className="absolute right-0 inset-y-0 w-24 flex items-center justify-end px-5 text-white">
        <Trash2 size={24} />
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
          if (info.offset.x < -60) {
            onDelete();
            if (navigator.vibrate) navigator.vibrate(50);
          }
        }}
        className="w-full bg-black h-full rounded-xl z-10 relative"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default function Bookmarks() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newRef, setNewRef] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { bookmarks, addBookmark, deleteBookmark } = useData();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(
    bookmarks.flatMap(b => (b.themes as unknown as string[]) || [])
  )).sort();

  const verses = bookmarks.filter(b => {
    const matchesSearch = b.verse.reference.toLowerCase().includes(search.toLowerCase()) || 
                          b.verse.text.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag ? ((b.themes as unknown as string[]) || []).includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const handleDownloadVerse = async () => {
    if (!newRef.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bible/search?ref=${encodeURIComponent(newRef)}&translation=web`);
      const data = await res.json();
      
      if (data.reference && data.text) {
        await addBookmark({
          reference: data.reference,
          text: data.text,
          book: data.reference.split(' ')[0],
          chapter: 1, // simplified
          verse: 1,
          version: 'WEB'
        });
        setNewRef('');
        setShowAdd(false);
        toast.success(`Added ${data.reference} to Bookmarks!`);
      } else {
        toast.error("Verse not found. Check the reference (e.g. John 3:16)");
      }
    } catch (err) {
      toast.error("Error fetching verse.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, ref: string) => {
    await deleteBookmark(id);
    toast.success(`Deleted ${ref}`);
  };

  return (
    <PageWrapper className="pb-24 bg-black text-white overflow-x-hidden">
      <header className="px-6 pt-12 pb-4 sticky top-0 bg-black/90 backdrop-blur-md z-30 border-b border-white/10">
        <h1 className="text-4xl font-sans font-black tracking-tighter mb-6">BOOKMARKS</h1>
        
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

        {allTags.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setSelectedTag(null)}
              className={`whitespace-nowrap px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest border rounded-full transition-colors ${!selectedTag ? 'bg-white text-black border-white' : 'bg-transparent text-white/50 border-white/20 hover:border-white/50'}`}
            >
              ALL
            </button>
            {allTags.map(tag => (
              <button 
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`whitespace-nowrap px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest border rounded-full transition-colors ${selectedTag === tag ? 'bg-red-600 text-white border-red-600' : 'bg-transparent text-white/50 border-white/20 hover:border-white/50'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="px-6 py-6">
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111] border border-white/20 rounded-xl p-5 mb-6 shadow-[4px_4px_0px_0px_rgba(255,0,0,0.5)]"
          >
            <h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] mb-3 text-red-500">Download from Cloud</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="e.g. John 11:35" 
                className="flex-1 bg-black border border-white/20 rounded py-3 px-4 focus:outline-none focus:border-white font-mono text-sm uppercase placeholder:text-white/30"
                value={newRef}
                onChange={(e) => setNewRef(e.target.value)}
              />
              <button 
                onClick={handleDownloadVerse}
                disabled={isLoading}
                className="bg-white text-black px-4 rounded font-mono font-bold hover:bg-white/80 transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <CloudDownload size={20} />}
              </button>
            </div>
          </motion.div>
        )}

        <StaggerList className="space-y-4 overflow-hidden">
          {verses.length === 0 ? (
            <EmptyState 
              icon={Bookmark} 
              title="NO SAVED VERSES" 
              description="You haven't bookmarked any verses yet."
              actionLabel="ADD VERSE"
              onAction={() => setShowAdd(true)}
            />
          ) : (
            verses.map((bookmark) => {
              const isRedLetter = redLetterVerses.has(bookmark.verse.reference);
              return (
                <SwipeableItem key={bookmark.id} onDelete={() => handleDelete(bookmark.id, bookmark.verse.reference)}>
                  <Link to={`/verse/${bookmark.id}`} className="block group">
                    <div className="p-5 bg-[#050505] border border-white/20 rounded-xl group-hover:border-red-600 transition-all">
                      <h3 className="font-mono text-[10px] font-bold text-red-500 tracking-[0.2em] uppercase mb-2">{bookmark.verse.reference}</h3>
                      <p className={`font-sans text-sm leading-snug line-clamp-2 ${isRedLetter ? 'text-red-500 font-bold' : 'text-white/80'}`}>{bookmark.verse.text}</p>
                    </div>
                  </Link>
                </SwipeableItem>
              );
            })
          )}
        </StaggerList>
      </main>

      {/* Floating Action Button */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAdd(!showAdd)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-white text-black rounded-full shadow-[4px_4px_0px_0px_rgba(255,0,0,1)] flex items-center justify-center transition-all z-40"
      >
        <Plus size={28} strokeWidth={2.5} className={`transition-transform ${showAdd ? 'rotate-45' : ''}`} />
      </motion.button>
    </PageWrapper>
  );
}
