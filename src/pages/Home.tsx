import { PageWrapper } from '../components/animations/PageWrapper';
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Flame, Target, BrainCircuit, Play, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useData } from '../store/useData';
import { useAuth } from '../store/useAuth';
import { motion } from 'framer-motion';

export default function Home() {
  const navigate = useNavigate();
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
    total: bookmarks?.length || 0,
    due: bookmarks?.filter(v => v.status !== 'NEW' && v.dueDate <= Date.now()).length || 0,
    mastered: bookmarks?.filter(v => v.status === 'MASTERED').length || 0,
    learning: bookmarks?.filter(v => v.status === 'LEARNING' || v.status === 'REVIEW').length || 0,
    new: bookmarks?.filter(v => v.status === 'NEW').length || 0,
  };

  return (
    <PageWrapper className="min-h-full pb-24 bg-black text-white font-sans">
      <header className="px-6 pt-12 pb-6 flex justify-between items-start sticky top-0 bg-black/90 backdrop-blur-md z-10 border-b border-white/10">
        <div>
          <p className="font-mono text-red-600 text-xs font-bold uppercase tracking-[0.2em] mb-1">System</p>
          <h1 className="text-4xl font-sans font-bold tracking-tighter">DASHBOARD</h1>
        </div>
        <button onClick={() => navigate('/settings')} className="p-2 text-white/50 hover:text-white transition-colors">
          <SettingsIcon size={24} strokeWidth={1.5} />
        </button>
      </header>

      <main className="px-6 py-8 space-y-6">
        
        {/* Primary Action Card */}
        <div className="bg-[#111] border border-white/20 rounded-2xl p-8 relative overflow-hidden group">
          <div 
            className="absolute -top-10 -right-10 w-40 h-40 opacity-10 pointer-events-none transition-transform group-hover:scale-110"
            style={{ 
              backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2.5px)',
              backgroundSize: '12px 12px'
            }}
          />
          <div className="relative z-10">
            <h2 className="font-sans text-5xl font-black tracking-tighter mb-2">{stats.due + Math.min(stats.new, 2)}</h2>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
              <p className="font-mono text-white/50 text-[10px] tracking-[0.2em] uppercase font-bold">Verses Ready For Review</p>
            </div>
          </div>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/memorize')}
            className="w-full bg-white text-black font-mono font-bold uppercase tracking-[0.1em] text-sm py-4 rounded-xl flex items-center justify-center gap-3 transition-transform relative z-10"
          >
            <Play size={16} fill="currentColor" strokeWidth={0} />
            INITIATE RECALL
          </motion.button>
        </div>

        {/* Streak Card */}
        <div className="bg-[#111] border border-white/20 p-6 relative overflow-hidden group">
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
        </div>

      </main>
    </PageWrapper>
  );
}
