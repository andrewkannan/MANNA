import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export default function Progress() {
  const allUserData = useLiveQuery(() => db.userData.toArray());
  const appState = useLiveQuery(() => db.appState.get('singleton' as any));

  const stats = {
    total: allUserData?.length || 0,
    MASTERED: allUserData?.filter(v => v.status === 'MASTERED').length || 0,
    STRONG: allUserData?.filter(v => v.status === 'STRONG').length || 0,
    REVIEW: allUserData?.filter(v => v.status === 'REVIEW').length || 0,
    LEARNING: allUserData?.filter(v => v.status === 'LEARNING').length || 0,
    NEW: allUserData?.filter(v => v.status === 'NEW').length || 0,
  };

  return (
    <div className="min-h-full pb-24 bg-[#F9F6F0]">
      <header className="px-6 pt-12 pb-6 border-b border-[#EAE5D9]">
        <h1 className="text-4xl font-serif text-[#2C2825]">Progress</h1>
      </header>

      <main className="px-6 py-6">
        <div className="bg-[#FDFBF7] border border-[#EAE5D9] rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="font-serif text-[#8B4513] uppercase tracking-widest text-sm mb-6">Retention</h2>
          <div className="w-full bg-[#EAE5D9] h-2 mb-8 flex rounded-full overflow-hidden">
            <div className="bg-[#2C2825] h-full transition-all" style={{ width: `${(stats.MASTERED / Math.max(1, stats.total)) * 100}%` }}></div>
            <div className="bg-[#8B4513] h-full transition-all" style={{ width: `${(stats.STRONG / Math.max(1, stats.total)) * 100}%` }}></div>
            <div className="bg-[#4A4541] h-full opacity-50 transition-all" style={{ width: `${((stats.LEARNING + stats.REVIEW) / Math.max(1, stats.total)) * 100}%` }}></div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-[#EAE5D9] border-dashed">
              <span className="font-serif text-[#4A4541]">Mastered</span>
              <span className="font-serif text-xl text-[#2C2825]">{stats.MASTERED}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[#EAE5D9] border-dashed">
              <span className="font-serif text-[#4A4541]">Strong</span>
              <span className="font-serif text-xl text-[#2C2825]">{stats.STRONG}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[#EAE5D9] border-dashed">
              <span className="font-serif text-[#4A4541]">Reviewing</span>
              <span className="font-serif text-xl text-[#2C2825]">{stats.REVIEW}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-serif text-[#4A4541]">Learning</span>
              <span className="font-serif text-xl text-[#2C2825]">{stats.LEARNING}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#FDFBF7] border border-[#EAE5D9] rounded-lg p-6 shadow-sm text-center">
            <p className="text-xs font-serif uppercase tracking-widest text-[#8B4513] mb-3">Current Streak</p>
            <p className="text-4xl font-serif text-[#2C2825]">{appState?.currentStreak || 0}</p>
          </div>
          <div className="bg-[#2C2825] border border-[#2C2825] rounded-lg p-6 shadow-sm text-center">
            <p className="text-xs font-serif uppercase tracking-widest text-[#EAE5D9] mb-3">Longest Streak</p>
            <p className="text-4xl font-serif text-[#FDFBF7]">{appState?.longestStreak || 0}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
