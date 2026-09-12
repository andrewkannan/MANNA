import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Upload, Bell, Wand2, BookOpen } from 'lucide-react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Settings() {
  const navigate = useNavigate();
  const appState = useLiveQuery(() => db.appState.get('singleton' as any));

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
    <div className="min-h-full pb-24 bg-black text-white font-sans">
      <header className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center z-10">
        <button onClick={() => navigate(-1)} className="flex items-center text-white hover:text-red-500 transition-colors">
          <ChevronLeft size={28} strokeWidth={2} className="-ml-2" />
        </button>
        <span className="font-mono text-sm tracking-[0.2em] font-bold uppercase ml-2 text-white">System Config</span>
      </header>

      <div className="p-6 max-w-[400px] mx-auto">
        <div className="mb-10">
          <h2 className="font-mono text-red-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Data Protocol</h2>
          <div className="bg-[#111] border border-white/20">
            <button onClick={handleExport} className="w-full p-4 border-b border-white/20 flex items-center gap-4 hover:bg-white hover:text-black transition-colors text-white">
              <Download size={18} strokeWidth={2} />
              <span className="font-mono text-xs uppercase tracking-widest font-bold">Export Backup</span>
            </button>
            <button className="w-full p-4 flex items-center gap-4 opacity-40 cursor-not-allowed text-white">
              <Upload size={18} strokeWidth={2} />
              <span className="font-mono text-xs uppercase tracking-widest font-bold">Import Backup</span>
            </button>
          </div>
          <p className="mt-3 text-[10px] font-mono uppercase tracking-widest text-white/40">Data is securely stored locally.</p>
        </div>

        <div className="mb-10">
          <h2 className="font-mono text-red-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Neural Engine</h2>
          <div className="bg-[#111] border border-white/20 p-5 mb-4">
            <div className="flex items-start gap-4 mb-4 text-white">
              <BookOpen size={18} strokeWidth={2} className="mt-0.5 text-red-500" />
              <div className="w-full">
                <p className="font-mono text-xs uppercase tracking-widest font-bold mb-2">Translation Protocol</p>
                <p className="font-sans text-xs text-white/50 leading-relaxed mb-4">
                  Select the default translation for new verses downloaded from the cloud directory.
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      const appState = await db.appState.get('singleton' as any);
                      if (appState) await db.appState.update('singleton' as any, { preferredVersion: 'web' });
                    }}
                    className={`flex-1 py-3 font-mono text-xs font-bold transition-colors border ${
                      appState?.preferredVersion !== 'kjv' 
                        ? 'bg-white text-black border-white' 
                        : 'bg-black text-white/50 border-white/20 hover:text-white'
                    }`}
                  >
                    WEB
                  </button>
                  <button 
                    onClick={async () => {
                      const appState = await db.appState.get('singleton' as any);
                      if (appState) await db.appState.update('singleton' as any, { preferredVersion: 'kjv' });
                    }}
                    className={`flex-1 py-3 font-mono text-xs font-bold transition-colors border ${
                      appState?.preferredVersion === 'kjv' 
                        ? 'bg-white text-black border-white' 
                        : 'bg-black text-white/50 border-white/20 hover:text-white'
                    }`}
                  >
                    KJV
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-white/20 p-5">
            <div className="flex items-start gap-4 mb-4 text-white">
              <Wand2 size={18} strokeWidth={2} className="mt-0.5 text-red-500" />
              <div>
                <p className="font-mono text-xs uppercase tracking-widest font-bold mb-2">Gemini API Key</p>
                <p className="font-sans text-xs text-white/50 leading-relaxed">
                  Provide an API key to enable AI art generation for new verses. (Stored locally).
                </p>
              </div>
            </div>
            <input 
              type="password"
              placeholder="ENTER KEY..."
              className="w-full bg-black border border-white/20 py-3 px-4 focus:outline-none focus:border-red-500 font-mono text-sm text-white placeholder:text-white/30"
              onChange={async (e) => {
                const val = e.target.value.trim();
                const state = await db.appState.get('singleton' as any);
                if (state) {
                  await db.appState.update('singleton' as any, { geminiApiKey: val });
                }
              }}
            />
          </div>
        </div>

        <div className="mb-10">
          <h2 className="font-mono text-red-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Notifications</h2>
          <div className="bg-[#111] border border-white/20 p-5 opacity-50 relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ 
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)'
              }}
            />
            <div className="flex items-center gap-4 mb-2 text-white relative z-10">
              <Bell size={18} strokeWidth={2} />
              <span className="font-mono text-xs uppercase tracking-widest font-bold">Push Alerts</span>
            </div>
            <p className="font-sans text-xs text-white/50 relative z-10">
              Daily review reminders are not currently supported in this client.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
