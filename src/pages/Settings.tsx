import { PageWrapper } from '../components/animations/PageWrapper';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Upload, Bell, Wand2, BookOpen, Monitor } from 'lucide-react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '../store/useAuth';

import { useData } from '../store/useData';

export default function Settings() {
  const navigate = useNavigate();
  const appState = useLiveQuery(() => db.appState.get('singleton' as any));

  const { addBookmark } = useData();

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

  const handleMigrate = async () => {
    const verses = await db.bibleVerses.toArray();
    let migrated = 0;
    for (const v of verses) {
      await addBookmark({
        reference: v.reference,
        text: v.text,
        book: v.book,
        chapter: v.chapter,
        verse: v.verse,
        version: v.version
      });
      migrated++;
    }
    alert(`Migrated ${migrated} verses to the cloud!`);
  };

  return (
    <PageWrapper className="min-h-full pb-24 bg-black text-white font-sans">
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
            <button onClick={handleMigrate} className="w-full p-4 border-b border-white/20 flex items-center gap-4 hover:bg-white hover:text-black transition-colors text-white">
              <Upload size={18} strokeWidth={2} />
              <span className="font-mono text-xs uppercase tracking-widest font-bold text-left leading-tight">Migrate Local DB to Cloud (One-time)</span>
            </button>
            <button onClick={handleExport} className="w-full p-4 border-b border-white/20 flex items-center gap-4 hover:bg-white hover:text-black transition-colors text-white">
              <Download size={18} strokeWidth={2} />
              <span className="font-mono text-xs uppercase tracking-widest font-bold">Export Backup</span>
            </button>
            <button 
              onClick={() => {
                useAuth.getState().logout();
                navigate('/login');
              }}
              className="w-full p-4 flex items-center gap-4 hover:bg-white hover:text-black transition-colors text-red-500 font-mono text-xs uppercase tracking-widest font-bold border-t border-white/20"
            >
              <span className="font-mono text-xs uppercase tracking-widest font-bold">Terminate Session (Logout)</span>
            </button>
          </div>
          <p className="mt-3 text-[10px] font-mono uppercase tracking-widest text-white/40">Data is securely synced to cloud.</p>
        </div>

        <div className="mb-10">
          <h2 className="font-mono text-red-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Neural Engine</h2>
          <div className="bg-[#111] border border-white/20 p-5 mb-4">
            <div className="flex items-start gap-4 mb-4 text-white">
              <Monitor size={18} strokeWidth={2} className="mt-0.5 text-red-500" />
              <div className="w-full">
                <p className="font-mono text-xs uppercase tracking-widest font-bold mb-2">Hardware Sync</p>
                <p className="font-sans text-xs text-white/50 leading-relaxed mb-4">
                  Manage paired T-Display-S3 hardware modules for external projection.
                </p>
                <button 
                  onClick={() => navigate('/devices')}
                  className="w-full bg-white text-black font-mono text-xs font-bold py-3 tracking-widest uppercase hover:bg-white/80 transition-colors"
                >
                  Manage Hardware
                </button>
              </div>
            </div>
          </div>
          
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

          <div className="bg-[#111] border border-white/20 p-5 mb-4">
            <div className="flex items-start gap-4 mb-4 text-white">
              <BookOpen size={18} strokeWidth={2} className="mt-0.5 text-red-500" />
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-mono text-xs uppercase tracking-widest font-bold">Dual-Language Protocol</p>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={appState?.showTamil || false}
                        onChange={async (e) => {
                          const val = e.target.checked;
                          const state = await db.appState.get('singleton' as any);
                          if (state) {
                            await db.appState.update('singleton' as any, { showTamil: val });
                          }
                        }}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${appState?.showTamil ? 'bg-red-600' : 'bg-white/20'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${appState?.showTamil ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                  </label>
                </div>
                <p className="font-sans text-xs text-white/50 leading-relaxed mb-4">
                  Automatically overlay Tamil (OVM) translation beneath English verses.
                </p>
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
          <div className="bg-[#111] border border-white/20 p-5">
            <div className="flex items-center justify-between mb-4 text-white">
              <div className="flex items-center gap-4">
                <Bell size={18} strokeWidth={2} className="text-red-500" />
                <span className="font-mono text-xs uppercase tracking-widest font-bold">Push Alerts</span>
              </div>
              <button
                onClick={async () => {
                  try {
                    const reg = await navigator.serviceWorker.ready;
                    const sub = await reg.pushManager.getSubscription();
                    if (sub) {
                      alert('Already subscribed!');
                    } else {
                      const res = await fetch('/api/push/vapidPublicKey');
                      const { publicKey } = await res.json();
                      
                      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
                      
                      const newSub = await reg.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedVapidKey
                      });
                      
                      await fetch('/api/push/register', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${useAuth.getState().token}`
                        },
                        body: JSON.stringify(newSub)
                      });
                      alert('Subscribed to push notifications!');
                    }
                  } catch (e: any) {
                    alert('Error: ' + e.message);
                  }
                }}
                className="bg-white text-black px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-white/80"
              >
                Enable
              </button>
            </div>
            <p className="font-sans text-xs text-white/50 mb-4">
              Receive daily reminders when verses are due for review.
            </p>
            <button
              onClick={async () => {
                try {
                  await fetch('/api/push/test', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${useAuth.getState().token}`
                    },
                    body: JSON.stringify({ title: 'System Alert', body: 'Push protocol active.' })
                  });
                } catch (e: any) {
                  alert('Error: ' + e.message);
                }
              }}
              className="w-full border border-white/20 py-2 font-mono text-[10px] uppercase tracking-widest text-white/50 hover:bg-white hover:text-black transition-colors"
            >
              Send Test Notification
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

// Utility function
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
