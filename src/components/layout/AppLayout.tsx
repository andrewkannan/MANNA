import { Outlet, NavLink } from 'react-router-dom';
import { Home, BookOpen, BrainCircuit, Activity, Monitor } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useEffect } from 'react';

export default function AppLayout() {
  const { isDarkMode } = useStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${
      isActive 
        ? 'bg-white text-black' 
        : 'text-white/50 hover:bg-white/10'
    }`;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative overflow-hidden bg-black nothing-grain">
      <main className="flex-1 overflow-y-auto pb-[100px] z-10 relative">
        <Outlet />
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] bg-black/90 backdrop-blur-md border border-white/20 rounded-full px-4 py-3 flex justify-between items-center z-50 shadow-[4px_4px_0px_0px_rgba(255,0,0,0.5)]">
        <NavLink to="/" className={navClass}>
          {({ isActive }) => <Home size={22} strokeWidth={isActive ? 2 : 1.5} />}
        </NavLink>
        <NavLink to="/library" className={navClass}>
          {({ isActive }) => <BookOpen size={22} strokeWidth={isActive ? 2 : 1.5} />}
        </NavLink>
        <NavLink to="/display" className={navClass}>
          {({ isActive }) => <Monitor size={22} strokeWidth={isActive ? 2 : 1.5} />}
        </NavLink>
        <NavLink to="/memorize" className={navClass}>
          {({ isActive }) => <BrainCircuit size={22} strokeWidth={isActive ? 2 : 1.5} />}
        </NavLink>
        <NavLink to="/progress" className={navClass}>
          {({ isActive }) => <Activity size={22} strokeWidth={isActive ? 2 : 1.5} />}
        </NavLink>
      </nav>
    </div>
  );
}
