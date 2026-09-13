import { useState, useEffect } from 'react';
import { Monitor, Search } from 'lucide-react';
import { useData } from '../store/useData';
import { useAuth } from '../store/useAuth';

export default function DisplayControl() {
  const { bookmarks } = useData();
  const token = useAuth(state => state.token);
  const [search, setSearch] = useState('');
  const [devices, setDevices] = useState<any[]>([]);
  const [activeVerseId, setActiveVerseId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch('/api/devices', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setDevices(data);
        if (data.length > 0 && data[0].activeVerseId) {
          setActiveVerseId(data[0].activeVerseId);
        }
      });
  }, [token]);

  const handleSetDisplay = async (verseId: string) => {
    setActiveVerseId(verseId);
    if (!token) return;
    
    // Sync with server for all devices
    for (const device of devices) {
      try {
        await fetch('/api/display/active', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            deviceId: device.id,
            verseId: verseId
          })
        });
      } catch (err) {
        console.error("Failed to sync with display server:", err);
      }
    }
  };

  const filteredBookmarks = bookmarks.filter(b => 
    b.verse.reference.toLowerCase().includes(search.toLowerCase()) || 
    b.verse.text.toLowerCase().includes(search.toLowerCase())
  );

  const activeBookmark = bookmarks.find(b => b.verse.id === activeVerseId);
  const activeVerse = activeBookmark?.verse;

  const handleSetAutoRotate = async (deviceId: string, autoRotate: boolean, rotateInterval: number) => {
    try {
      await fetch(`/api/devices/${deviceId}/config`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ autoRotate, rotateInterval })
      });
      // update local state
      setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, autoRotate, rotateInterval } : d));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-full pb-24 bg-black text-white">
      <header className="px-6 pt-12 pb-6 border-b border-white/10">
        <h1 className="text-4xl font-sans font-black tracking-tighter">DISPLAY</h1>
        <p className="font-mono text-red-600 text-[10px] tracking-[0.2em] uppercase mt-1 font-bold">Hardware Sync</p>
      </header>

      <main className="px-6 py-6">
        {devices.length > 0 && (
          <div className="mb-8">
            <h2 className="font-mono text-white/50 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Hardware Settings</h2>
            <div className="space-y-4">
              {devices.map(device => (
                <div key={device.id} className="bg-[#111] border border-white/10 p-5 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-mono text-xs font-bold tracking-widest uppercase">{device.name || "T-Display"}</h3>
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={device.autoRotate || false}
                          onChange={(e) => handleSetAutoRotate(device.id, e.target.checked, device.rotateInterval || 60)}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${device.autoRotate ? 'bg-red-600' : 'bg-white/20'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${device.autoRotate ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-white/70">Auto Rotate</span>
                    </label>
                  </div>
                  {device.autoRotate && (
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between font-mono text-[10px] text-white/50">
                        <span>Interval: {device.rotateInterval || 60}m</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="1440" 
                        value={device.rotateInterval || 60}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setDevices(prev => prev.map(d => d.id === device.id ? { ...d, rotateInterval: val } : d));
                        }}
                        onMouseUp={(e) => handleSetAutoRotate(device.id, true, parseInt((e.target as any).value))}
                        onTouchEnd={(e) => handleSetAutoRotate(device.id, true, parseInt((e.target as any).value))}
                        className="w-full accent-red-600"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="font-mono text-white/50 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Active Feed</h2>
        
        {activeVerse ? (
          <div className="bg-transparent border border-white/20 rounded-2xl overflow-hidden mb-8 group relative">
            <div 
              className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none transition-transform group-hover:scale-110 z-0"
              style={{ 
                backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1.5px)',
                backgroundSize: '10px 10px'
              }}
            />
            <div 
              className="h-32 w-full bg-cover bg-center relative grayscale contrast-150 opacity-30 z-10"
              style={{ backgroundImage: `url(${activeBookmark?.imageUrl || '/images/world_map.jpg'})` }}
            >
              <div className="absolute inset-0 bg-black/50" />
            </div>
            
            <div className="absolute top-[30px] left-0 w-full px-6 z-20">
                <p className="text-white font-sans font-bold leading-snug line-clamp-3 text-sm text-left">
                  "{activeVerse.text}"
                </p>
            </div>

            <div className="p-4 flex flex-col gap-4 border-t border-white/10 bg-[#0a0a0a] relative z-20">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                <span className="font-mono text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase">{activeVerse.reference}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => window.open('/t-display', '_blank')}
                  className="flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white bg-transparent hover:bg-white/5 border border-white/20 py-3 rounded-lg transition-colors"
                >
                  <Monitor size={14} /> Classic
                </button>
                <button 
                  onClick={() => window.open('/t-display-nothing', '_blank')}
                  className="flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-black bg-white hover:bg-white/80 py-3 rounded-lg transition-colors"
                >
                  <Monitor size={14} /> OS 5.0
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-transparent border border-white/20 border-dashed rounded-xl p-8 mb-8 text-center">
            <Monitor className="mx-auto text-white/30 mb-3" size={32} strokeWidth={1.5} />
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/50 font-bold">NO FEED SELECTED</p>
          </div>
        )}

        <h2 className="font-mono text-white/50 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Library Feed</h2>
        
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={16} strokeWidth={2} />
          <input 
            type="text" 
            placeholder="SEARCH..." 
            className="w-full bg-[#111] border border-white/20 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-red-600 font-mono text-xs tracking-widest uppercase transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-3 h-[300px] overflow-y-auto pr-2 pb-10">
          {filteredBookmarks.map((bookmark) => (
            <div 
              key={bookmark.id} 
              onClick={() => handleSetDisplay(bookmark.verse.id)}
              className={`p-4 border rounded-xl cursor-pointer transition-all ${
                activeVerseId === bookmark.verse.id 
                  ? 'bg-[#111] border-red-600' 
                  : 'bg-transparent border-white/10 hover:border-white/30'
              }`}
            >
              <h3 className="font-mono text-[10px] text-red-500 font-bold tracking-[0.2em] uppercase mb-1">{bookmark.verse.reference}</h3>
              <p className="text-white/80 font-sans text-xs line-clamp-1">{bookmark.verse.text}</p>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
