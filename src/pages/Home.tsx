import { PageWrapper } from '../components/animations/PageWrapper';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useNavigate } from 'react-router-dom';
import { Play, Settings as SettingsIcon } from 'lucide-react';
import { useData } from '../store/useData';
import { useAuth } from '../store/useAuth';

export default function Home() {
  const navigate = useNavigate();
  const { bookmarks = [], loading } = useData();
  const user = useAuth(state => state.user);

  const appState = useLiveQuery(() => db.appState.get('singleton' as any));

  const stats = {
    total: bookmarks?.length || 0,
    due: bookmarks?.filter(v => v.status !== 'NEW' && v.dueDate <= Date.now()).length || 0,
    new: bookmarks?.filter(v => v.status === 'NEW').length || 0,
    mastered: bookmarks?.filter(v => v.status === 'MASTERED').length || 0,
  };

  return (
    <PageWrapper className="min-h-full pb-24 bg-black text-white">
      <header className="px-6 pt-12 pb-6 flex justify-between items-start">
        <div>
          <p className="font-mono text-red-600 text-xs font-bold uppercase tracking-[0.2em] mb-1">System</p>
          <h1 className="text-4xl font-sans font-bold tracking-tighter">TODAY</h1>
        </div>
        <button onClick={() => navigate('/settings')} className="p-2 text-white/50 hover:text-white transition-colors">
          <SettingsIcon size={24} strokeWidth={1.5} />
        </button>
      </header>

      <main className="px-6">
        {/* Primary Action Card */}
        <div className="bg-[#111] border border-white/20 rounded-2xl p-8 mb-8 relative overflow-hidden group">
          {/* Dot matrix pattern accent */}
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
              <p className="font-mono text-white/50 text-[10px] tracking-[0.2em] uppercase font-bold">Verses Ready</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/memorize')}
            className="w-full bg-white text-black font-mono font-bold uppercase tracking-[0.1em] text-sm py-4 rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform relative z-10"
          >
            <Play size={16} fill="currentColor" strokeWidth={0} />
            INITIATE
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-transparent border border-white/10 rounded-2xl p-5 relative overflow-hidden">
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/50 mb-2">Mastered</p>
            <p className="text-4xl font-sans font-black tracking-tighter">{stats.mastered}</p>
          </div>
          <div className="bg-transparent border border-white/10 rounded-2xl p-5 relative overflow-hidden">
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/50 mb-2">Streak</p>
            <p className="text-4xl font-sans font-black tracking-tighter">{appState?.currentStreak || 0}</p>
          </div>
        </div>
      </main>
    </PageWrapper>
  );
}
