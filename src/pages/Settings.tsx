import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Upload, Bell, Wand2 } from 'lucide-react';
import { db } from '../db/db';

export default function Settings() {
  const navigate = useNavigate();

  const handleExport = async () => {
    const verses = await db.bibleVerses.toArray();
    const userData = await db.userData.toArray();
    
    const exportData = {
      version: 1,
      timestamp: Date.now(),
      bibleVerses: verses,
      userData: userData,
    };

    const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `word-and-remember-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full pb-24 bg-[#F9F6F0]">
      <header className="sticky top-0 bg-[#F9F6F0]/90 backdrop-blur-md border-b border-[#EAE5D9] px-4 py-3 flex items-center z-10">
        <button onClick={() => navigate(-1)} className="flex items-center text-[#2C2825] hover:opacity-70 transition-opacity">
          <ChevronLeft size={28} strokeWidth={1.5} className="-ml-2" />
        </button>
        <span className="font-serif text-lg text-[#2C2825] ml-2">Settings</span>
      </header>

      <div className="p-6 max-w-[500px] mx-auto">
        <div className="mb-10">
          <h2 className="font-serif text-[#8B4513] uppercase tracking-widest text-sm mb-4">Data & Backup</h2>
          <div className="bg-[#FDFBF7] border border-[#EAE5D9] rounded-lg shadow-sm overflow-hidden">
            <button onClick={handleExport} className="w-full p-4 border-b border-[#EAE5D9] flex items-center gap-4 hover:bg-[#F9F6F0] transition-colors text-[#2C2825]">
              <Download size={20} strokeWidth={1.5} />
              <span className="font-serif">Export Backup</span>
            </button>
            <button className="w-full p-4 flex items-center gap-4 opacity-40 cursor-not-allowed text-[#2C2825]">
              <Upload size={20} strokeWidth={1.5} />
              <span className="font-serif">Import Backup</span>
            </button>
          </div>
          <p className="mt-3 text-xs font-serif italic text-[#4A4541] opacity-70">Data is securely stored locally on your device.</p>
        </div>

        <div className="mb-10">
          <h2 className="font-serif text-[#8B4513] uppercase tracking-widest text-sm mb-4">AI Features</h2>
          <div className="bg-[#FDFBF7] border border-[#EAE5D9] rounded-lg shadow-sm p-5">
            <div className="flex items-start gap-4 mb-4 text-[#2C2825]">
              <Wand2 size={20} strokeWidth={1.5} className="mt-1" />
              <div>
                <p className="font-serif mb-2">Gemini API Key</p>
                <p className="font-serif text-sm text-[#4A4541] leading-relaxed">
                  Provide an API key to enable AI art generation for new verses. (Stored locally).
                </p>
              </div>
            </div>
            <input 
              type="password"
              placeholder="Enter Key..."
              className="w-full bg-white border border-[#EAE5D9] rounded py-2 px-3 focus:outline-none focus:border-[#8B4513] font-serif text-[#2C2825]"
              onChange={async (e) => {
                const val = e.target.value.trim();
                const appState = await db.appState.get('singleton' as any);
                if (appState) {
                  await db.appState.update('singleton' as any, { geminiApiKey: val });
                }
              }}
            />
          </div>
        </div>

        <div className="mb-10">
          <h2 className="font-serif text-[#8B4513] uppercase tracking-widest text-sm mb-4">Reminders</h2>
          <div className="bg-[#FDFBF7] border border-[#EAE5D9] rounded-lg shadow-sm p-5 opacity-60">
            <div className="flex items-center gap-4 mb-2 text-[#2C2825]">
              <Bell size={20} strokeWidth={1.5} />
              <span className="font-serif">Push Notifications</span>
            </div>
            <p className="font-serif text-sm text-[#4A4541]">
              Daily review reminders are not currently supported in this browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
