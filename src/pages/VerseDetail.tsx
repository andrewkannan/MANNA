import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { ChevronLeft, Edit2 } from 'lucide-react';
import EditableSection from '../components/EditableSection';
import NothingCard from '../components/ArtCard';

export default function VerseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const verse = useLiveQuery(() => id ? db.bibleVerses.get(id) : undefined, [id]);
  const userData = useLiveQuery(() => id ? db.userData.get(id) : undefined, [id]);

  if (!verse || !userData) {
    return <div className="p-6 font-mono text-center mt-10 text-white/50 tracking-widest uppercase">Loading...</div>;
  }

  const handleUpdate = async (field: keyof typeof userData, value: any) => {
    if (id) {
      await db.userData.update(id, { [field]: value });
    }
  };

  return (
    <div className="min-h-full pb-10 bg-black text-white font-sans">
      <header className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between z-30">
        <button onClick={() => navigate(-1)} className="flex items-center text-white hover:text-red-500 transition-colors">
          <ChevronLeft size={28} strokeWidth={2} className="-ml-2" />
        </button>
        <div className="font-mono text-[10px] uppercase font-bold tracking-[0.2em] text-white">{verse.reference}</div>
        <button className="text-white/50 hover:text-white transition-colors">
          <Edit2 size={18} strokeWidth={2} />
        </button>
      </header>

      <div className="p-6 max-w-[400px] mx-auto">
        <div className="mb-12 mt-4 relative">
          <NothingCard 
             verseDetails={verse} 
             userData={userData} 
             isFlipped={false} 
             onClick={() => {}} 
          />
        </div>

        <div className="space-y-6">
          <div className="bg-[#111] p-5 border border-white/20">
             <EditableSection
              title="Tamil Explanation"
              value={userData.tamilExplanation || ''}
              onSave={(val) => handleUpdate('tamilExplanation', val)}
              placeholder="Add Tamil translation or notes..."
            />
          </div>

          <div className="bg-[#111] p-5 border border-white/20">
            <EditableSection
              title="Personal Notes"
              value={userData.personalNotes || ''}
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
    </div>
  );
}
