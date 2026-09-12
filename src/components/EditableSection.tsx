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
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-serif text-[#2C2825] text-lg">{title}</h3>
        {!isEditing && (
          <button onClick={() => { setTempVal(value); setIsEditing(true); }} className="font-serif text-sm text-[#8B4513] hover:opacity-70 transition-opacity">Edit</button>
        )}
      </div>
      <div className="border border-[#EAE5D9] bg-[#FDFBF7] rounded shadow-sm overflow-hidden">
        {isEditing ? (
          <textarea
            autoFocus
            value={tempVal}
            onChange={(e) => setTempVal(e.target.value)}
            className="w-full bg-transparent p-4 focus:outline-none min-h-[120px] font-serif text-[#4A4541] resize-none"
            placeholder={placeholder}
          />
        ) : (
          <div 
            className={`p-4 font-serif text-[#4A4541] min-h-[80px] whitespace-pre-wrap ${!value && 'opacity-40 italic'}`}
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
          <button onClick={() => setIsEditing(false)} className="px-4 py-2 font-serif text-sm text-[#4A4541]">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 font-serif text-sm bg-[#2C2825] text-[#FDFBF7] rounded">Save</button>
        </div>
      )}
    </div>
  );
}
