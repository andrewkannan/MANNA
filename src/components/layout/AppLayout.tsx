import { Outlet, NavLink } from 'react-router-dom';
import { Home, Bookmark, BrainCircuit, Monitor, Database } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

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
    `flex flex-col items-center justify-center w-full h-full border-r border-white/20 last:border-r-0 transition-colors select-none ${
      isActive 
        ? 'bg-white text-black' 
        : 'text-white/40 active:bg-white/10 active:text-white'
    }`;

  const NavIcon = ({ isActive, icon: Icon }: { isActive: boolean, icon: any }) => (
    <motion.div
      whileTap={{ scale: 0.85 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
    </motion.div>
  );

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-black nothing-grain font-sans">
      {/* Dynamic safe area padding applied to main */}
      <main 
        className="flex-1 overflow-y-auto z-10 relative scrollbar-none"
        style={{ paddingBottom: 'calc(70px + env(safe-area-inset-bottom, 0px))', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <Outlet />
      </main>

      <nav 
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-black border-t-2 border-white/20 flex justify-between items-center z-50"
        style={{ height: 'calc(70px + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <NavLink to="/" className={navClass}>
          {({ isActive }) => <NavIcon isActive={isActive} icon={Home} />}
        </NavLink>
        <NavLink to="/directory" className={navClass}>
          {({ isActive }) => <NavIcon isActive={isActive} icon={Database} />}
        </NavLink>
        <NavLink to="/bookmarks" className={navClass}>
          {({ isActive }) => <NavIcon isActive={isActive} icon={Bookmark} />}
        </NavLink>
        <NavLink to="/display" className={navClass}>
          {({ isActive }) => <NavIcon isActive={isActive} icon={Monitor} />}
        </NavLink>
        <NavLink to="/memorize" className={navClass}>
          {({ isActive }) => <NavIcon isActive={isActive} icon={BrainCircuit} />}
        </NavLink>
      </nav>
    </div>
  );
}
