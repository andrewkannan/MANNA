import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Activity, Flame, Target, BrainCircuit } from 'lucide-react';

import { useData } from '../store/useData';
import { useAuth } from '../store/useAuth';

export default function Progress() {
  const { bookmarks } = useData();
  const token = useAuth(state => state.token);
  const appState = useLiveQuery(() => db.appState.get('singleton' as any));
  const [heatmapLogs, setHeatmapLogs] = useState<{date: string, count: number}[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/bookmarks/heatmap', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setHeatmapLogs(d);
      })
      .catch(console.error);
  }, [token]);

  const stats = {
    total: bookmarks.length || 0,
    mastered: bookmarks.filter(v => v.status === 'MASTERED').length || 0,
    learning: bookmarks.filter(v => v.status === 'LEARNING' || v.status === 'REVIEW').length || 0,
    new: bookmarks.filter(v => v.status === 'NEW').length || 0,
  };

  return (
    <div className="min-h-full pb-24 bg-black text-white font-sans">
      <header className="px-6 pt-12 pb-6 sticky top-0 bg-black/90 backdrop-blur-md z-10 border-b border-white/10">
        <h1 className="text-4xl font-black tracking-tighter">ANALYTICS</h1>
        <p className="font-mono text-red-500 text-[10px] tracking-[0.2em] uppercase font-bold mt-1">System Diagnostics</p>
      </header>

      <main className="px-6 py-8 space-y-6">
        
        {/* Streak Card */}
        <div className="bg-[#111] border border-white/20 p-6 relative overflow-hidden group">
          <div 
            className="absolute -right-10 -bottom-10 w-40 h-40 opacity-10 pointer-events-none transition-transform group-hover:scale-110"
            style={{ 
              backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2.5px)',
              backgroundSize: '12px 12px'
            }}
          />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 bg-red-600 flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
              <Flame size={32} className="text-black" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-mono text-white/50 text-[10px] tracking-[0.2em] uppercase font-bold mb-1">Current Streak</p>
              <h2 className="text-5xl font-black tracking-tighter">{appState?.currentStreak || 0} <span className="text-xl text-white/30 font-bold">DAYS</span></h2>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-transparent border border-white/10 p-5">
            <Target className="text-white/30 mb-4" size={24} />
            <p className="font-mono text-white/50 text-[10px] tracking-[0.2em] uppercase font-bold mb-1">Mastered</p>
            <p className="text-4xl font-black tracking-tighter text-white">{stats.mastered}</p>
          </div>
          <div className="bg-transparent border border-white/10 p-5">
            <BrainCircuit className="text-white/30 mb-4" size={24} />
            <p className="font-mono text-white/50 text-[10px] tracking-[0.2em] uppercase font-bold mb-1">Learning</p>
            <p className="text-4xl font-black tracking-tighter text-white">{stats.learning}</p>
          </div>
        </div>

        {/* Total Verses Tracker */}
        <div className="bg-transparent border border-white/20 p-6 mt-8">
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold text-white/70">Database Volume</h3>
            <span className="font-black text-2xl">{stats.total}</span>
          </div>
          <div className="h-2 w-full bg-[#111] flex overflow-hidden">
            <div 
              className="h-full bg-red-600" 
              style={{ width: `${stats.total > 0 ? (stats.mastered / stats.total) * 100 : 0}%` }}
            />
            <div 
              className="h-full bg-white" 
              style={{ width: `${stats.total > 0 ? (stats.learning / stats.total) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-600" />
              <span className="font-mono text-[8px] uppercase tracking-widest text-white/50">Mastered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white" />
              <span className="font-mono text-[8px] uppercase tracking-widest text-white/50">Learning</span>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-transparent border border-white/20 p-6 mt-8">
          <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold text-white/70 mb-4">Activity Core</h3>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 60 }).map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (59 - i));
              const dateStr = d.toISOString().split('T')[0];
              const log = heatmapLogs.find(l => l.date === dateStr);
              
              let bgColor = 'bg-[#111]';
              if (log) {
                if (log.count > 10) bgColor = 'bg-red-500';
                else if (log.count > 5) bgColor = 'bg-red-700';
                else if (log.count > 0) bgColor = 'bg-red-950';
              }
              
              return (
                <div 
                  key={i} 
                  title={`${dateStr}: ${log?.count || 0} reviews`}
                  className={`w-3 h-3 ${bgColor} border border-black`}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-2 mt-3 font-mono text-[8px] uppercase tracking-widest text-white/50">
            <span>Less</span>
            <div className="w-2 h-2 bg-[#111]" />
            <div className="w-2 h-2 bg-red-950" />
            <div className="w-2 h-2 bg-red-700" />
            <div className="w-2 h-2 bg-red-500" />
            <span>More</span>
          </div>
        </div>

      </main>
    </div>
  );
}
