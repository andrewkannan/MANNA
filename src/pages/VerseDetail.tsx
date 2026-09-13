import { PageWrapper } from '../components/animations/PageWrapper';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit2 } from 'lucide-react';
import EditableSection from '../components/EditableSection';
import NothingCard from '../components/ArtCard';
import { useData } from '../store/useData';

export default function VerseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { bookmarks, updateBookmark } = useData();
  const bookmark = bookmarks.find(b => b.id === id);

  if (!bookmark) {
    return <div className="p-6 font-mono text-center mt-10 text-white/50 tracking-widest uppercase">Loading...</div>;
  }

  const verse = bookmark.verse;

  const handleUpdate = async (field: keyof typeof bookmark, value: any) => {
    if (id) {
      await updateBookmark(id, { [field]: value });
    }
  };

  const playAudio = (text: string, lang: 'en-US' | 'ta-IN') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = lang === 'ta-IN' ? 0.8 : 0.9;
      
      // Try to find a specific voice for the language
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.includes(lang.split('-')[0]));
      if (voice) utterance.voice = voice;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <PageWrapper className="min-h-full pb-10 bg-black text-white font-sans">
      <header className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between z-30">
        <button onClick={() => navigate(-1)} className="flex items-center text-white hover:text-red-500 transition-colors">
          <ChevronLeft size={28} strokeWidth={2} className="-ml-2" />
        </button>
        <div className="font-mono text-[10px] uppercase font-bold tracking-[0.2em] text-white">{verse.reference}</div>
        <div className="flex gap-3">
          <button 
            onClick={() => playAudio(verse.text, 'en-US')}
            className="flex items-center gap-1 bg-[#111] border border-white/20 px-2 py-1 font-mono text-[8px] uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
          >
            ENG
          </button>
          {bookmark.tamilExplanation && (
            <button 
              onClick={() => playAudio(bookmark.tamilExplanation || '', 'ta-IN')}
              className="flex items-center gap-1 bg-[#111] border border-white/20 px-2 py-1 font-mono text-[8px] uppercase tracking-widest hover:bg-white hover:text-black transition-colors text-red-500"
            >
              TAMIL
            </button>
          )}
        </div>
      </header>

      <div className="p-6 max-w-[400px] mx-auto">
        <div className="mb-12 mt-4 relative">
          <NothingCard 
             verseDetails={verse} 
             userData={bookmark} 
             isFlipped={false} 
             onClick={() => {}} 
          />
        </div>

        <div className="space-y-6">
          <div className="bg-[#111] p-5 border border-white/20">
            <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold text-red-500 mb-3">Tags / Themes</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {(bookmark.themes as unknown as string[] || []).map(tag => (
                <div key={tag} className="bg-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 border border-white/20">
                  {tag}
                  <button onClick={() => {
                    const newThemes = (bookmark.themes as unknown as string[]).filter(t => t !== tag);
                    handleUpdate('themes', newThemes);
                  }} className="text-white/50 hover:text-red-500">
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <input 
              type="text" 
              placeholder="ADD TAG + ENTER" 
              className="w-full bg-black border border-white/20 p-3 font-mono text-[10px] uppercase tracking-widest focus:outline-none focus:border-red-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value.trim().toUpperCase();
                  if (val && !(bookmark.themes as unknown as string[] || []).includes(val)) {
                    handleUpdate('themes', [...(bookmark.themes as unknown as string[] || []), val]);
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
          </div>

          <div className="bg-[#111] p-5 border border-white/20">
             <EditableSection
              title="Tamil Explanation"
              value={bookmark.tamilExplanation || ''}
              onSave={(val) => handleUpdate('tamilExplanation', val)}
              placeholder="Add Tamil translation or notes..."
            />
          </div>

          <div className="bg-[#111] p-5 border border-white/20">
            <EditableSection
              title="Personal Notes"
              value={bookmark.personalNotes || ''}
              onSave={(val) => handleUpdate('personalNotes', val)}
              placeholder="System log / notes..."
            />
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/memorize')}
          className="w-full mt-10 bg-white text-black font-mono font-bold uppercase tracking-[0.2em] text-sm py-4 border border-white hover:bg-black hover:text-white transition-colors"
        >
          INITIATE RECALL
        </button>
      </div>
    </PageWrapper>
  );
}
