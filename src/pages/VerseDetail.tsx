import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { ChevronLeft, Edit2 } from 'lucide-react';
import EditableSection from '../components/EditableSection';
import ArtCard from '../components/ArtCard';

export default function VerseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const verse = useLiveQuery(() => id ? db.bibleVerses.get(id) : undefined, [id]);
  const userData = useLiveQuery(() => id ? db.userData.get(id) : undefined, [id]);

  if (!verse || !userData) {
    return <div className="p-6 font-serif text-center mt-10 text-[#4A4541]">Loading...</div>;
  }

  const handleUpdate = async (field: keyof typeof userData, value: any) => {
    if (id) {
      await db.userData.update(id, { [field]: value });
    }
  };

  return (
    <div className="min-h-full pb-10 bg-[#F9F6F0]">
      <header className="sticky top-0 bg-[#F9F6F0]/90 backdrop-blur-md border-b border-[#EAE5D9] px-4 py-3 flex items-center justify-between z-10">
        <button onClick={() => navigate(-1)} className="flex items-center text-[#2C2825] hover:opacity-70 transition-opacity">
          <ChevronLeft size={28} strokeWidth={1.5} className="-ml-2" />
        </button>
        <div className="font-serif text-lg text-[#2C2825]">{verse.reference}</div>
        <button className="text-[#2C2825] hover:opacity-70 transition-opacity">
          <Edit2 size={20} strokeWidth={1.5} />
        </button>
      </header>

      <div className="p-6 max-w-[500px] mx-auto">
        <div className="mb-12 mt-4">
           {userData.imageUrl ? (
             <ArtCard reference={verse.reference} text={verse.text} imageUrl={userData.imageUrl} />
           ) : (
             <div className="bg-[#FDFBF7] p-8 rounded-lg shadow-md border border-[#EAE5D9] text-center">
                <h2 className="font-serif text-2xl text-[#2C2825] mb-4">{verse.reference}</h2>
                <p className="font-serif text-[#4A4541] leading-relaxed">{verse.text}</p>
             </div>
           )}
        </div>

        <div className="space-y-8">
          <EditableSection
            title="Tamil Explanation"
            value={userData.tamilExplanation || ''}
            onSave={(val) => handleUpdate('tamilExplanation', val)}
            placeholder="Add Tamil translation or notes..."
          />

          <EditableSection
            title="Personal Notes"
            value={userData.personalNotes || ''}
            onSave={(val) => handleUpdate('personalNotes', val)}
            placeholder="What is God speaking to you through this verse?"
          />
        </div>
        
        <button 
          onClick={() => navigate('/memorize', { state: { singleVerseId: verse.id } })}
          className="w-full mt-12 bg-[#2C2825] text-[#FDFBF7] font-serif text-lg py-4 rounded shadow-md active:scale-[0.98] transition-transform"
        >
          Memorize This Verse
        </button>
      </div>
    </div>
  );
}
