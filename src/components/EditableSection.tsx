import { useState } from 'react';

interface EditableSectionProps {
  title: string;
  value: string;
  placeholder?: string;
  onSave: (val: string) => void;
}

export default function EditableSection({ title, value, placeholder, onSave }: EditableSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value);

  const handleSave = () => {
    onSave(tempVal);
    setIsEditing(false);
  };

  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-mono text-white/50 text-[10px] font-bold tracking-[0.2em] uppercase">{title}</h3>
        {!isEditing && (
          <button onClick={() => { setTempVal(value); setIsEditing(true); }} className="font-mono text-[10px] uppercase tracking-widest text-white hover:text-red-500 transition-colors">EDIT</button>
        )}
      </div>
      <div className="bg-black border border-white/20">
        {isEditing ? (
          <textarea
            autoFocus
            value={tempVal}
            onChange={(e) => setTempVal(e.target.value)}
            className="w-full bg-transparent p-4 focus:outline-none focus:border-red-500 border-b-2 border-transparent min-h-[120px] font-sans text-sm text-white resize-none placeholder:text-white/30"
            placeholder={placeholder}
          />
        ) : (
          <div 
            className={`p-4 font-sans text-sm text-white/80 min-h-[80px] whitespace-pre-wrap ${!value && 'opacity-40 italic'}`}
            onClick={() => {
              setTempVal(value);
              setIsEditing(true);
            }}
          >
            {value || placeholder}
          </div>
        )}
      </div>
      {isEditing && (
        <div className="flex justify-end gap-3 mt-3">
          <button onClick={() => setIsEditing(false)} className="px-4 py-2 font-mono text-[10px] uppercase font-bold text-white/50 hover:text-white">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 font-mono text-[10px] uppercase font-bold bg-white text-black hover:bg-black hover:text-white border border-white transition-colors">Save</button>
        </div>
      )}
    </div>
  );
}
