import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Bookmark, BrainCircuit, Monitor, Database } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppLayout() {
  const { isDarkMode } = useStore();
  const location = useLocation();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const NavIcon = ({ isActive, icon: Icon, label }: { isActive: boolean, icon: any, label: string }) => (
    <motion.div
      className={`flex flex-col items-center justify-center w-full h-full cursor-pointer select-none transition-colors duration-200 ${isActive ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
      whileTap={{ scale: 0.85, opacity: 0.7 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => {
        if (navigator.vibrate) navigator.vibrate(50);
      }}
    >
      <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} className="mb-0.5" />
      {isActive && <motion.div layoutId="navIndicator" className="w-1 h-1 bg-white rounded-full mt-1 absolute bottom-2" />}
    </motion.div>
  );

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-black nothing-grain font-sans overflow-hidden">
      <main 
        className="flex-1 overflow-y-auto z-10 relative scrollbar-none"
        style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <nav 
        className="fixed left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-full flex justify-between items-center z-50 shadow-2xl shadow-black/50 overflow-hidden"
        style={{ 
          bottom: 'calc(15px + env(safe-area-inset-bottom, 0px))',
          height: '65px' 
        }}
      >
        <NavLink to="/" className="flex-1 h-full relative flex items-center justify-center">
          {({ isActive }) => <NavIcon isActive={isActive} icon={Home} label="Home" />}
        </NavLink>
        <NavLink to="/directory" className="flex-1 h-full relative flex items-center justify-center">
          {({ isActive }) => <NavIcon isActive={isActive} icon={Database} label="Library" />}
        </NavLink>
        <NavLink to="/bookmarks" className="flex-1 h-full relative flex items-center justify-center">
          {({ isActive }) => <NavIcon isActive={isActive} icon={Bookmark} label="Saved" />}
        </NavLink>
        <NavLink to="/display" className="flex-1 h-full relative flex items-center justify-center">
          {({ isActive }) => <NavIcon isActive={isActive} icon={Monitor} label="Hardware" />}
        </NavLink>
        <NavLink to="/memorize" className="flex-1 h-full relative flex items-center justify-center">
          {({ isActive }) => <NavIcon isActive={isActive} icon={BrainCircuit} label="AI" />}
        </NavLink>
      </nav>
    </div>
  );
}
