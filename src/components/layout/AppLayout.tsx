import { Outlet, NavLink } from 'react-router-dom';
import { Home, BookOpen, BrainCircuit, Activity, Monitor, Database } from 'lucide-react';
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
    `flex flex-col items-center justify-center w-full h-full border-r border-white/20 last:border-r-0 transition-colors ${
      isActive 
        ? 'bg-white text-black' 
        : 'text-white/40 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-black nothing-grain font-sans">
      <main className="flex-1 overflow-y-auto pb-[70px] z-10 relative scrollbar-none">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[70px] bg-black border-t-2 border-white/20 flex justify-between items-center z-50">
        <NavLink to="/" className={navClass}>
          {({ isActive }) => <Home size={22} strokeWidth={isActive ? 2.5 : 1.5} />}
        </NavLink>
        <NavLink to="/directory" className={navClass}>
          {({ isActive }) => <Database size={22} strokeWidth={isActive ? 2.5 : 1.5} />}
        </NavLink>
        <NavLink to="/library" className={navClass}>
          {({ isActive }) => <BookOpen size={22} strokeWidth={isActive ? 2.5 : 1.5} />}
        </NavLink>
        <NavLink to="/display" className={navClass}>
          {({ isActive }) => <Monitor size={22} strokeWidth={isActive ? 2.5 : 1.5} />}
        </NavLink>
        <NavLink to="/memorize" className={navClass}>
          {({ isActive }) => <BrainCircuit size={22} strokeWidth={isActive ? 2.5 : 1.5} />}
        </NavLink>
        <NavLink to="/progress" className={navClass}>
          {({ isActive }) => <Activity size={22} strokeWidth={isActive ? 2.5 : 1.5} />}
        </NavLink>
      </nav>
    </div>
  );
}
