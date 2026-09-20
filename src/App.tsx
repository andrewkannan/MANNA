import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import Bookmarks from './pages/Bookmarks';
import VerseDetail from './pages/VerseDetail';
import Settings from './pages/Settings';
import Memorize from './pages/Memorize';
import TDisplayPreview from './pages/TDisplayPreview';
import TDisplayNothingOS from './pages/TDisplayNothingOS';
import DisplayControl from './pages/DisplayControl';
import Directory from './pages/Directory';
import Login from './pages/Login';
import Devices from './pages/Devices';
import Admin from './pages/Admin';
import { initializeDatabase } from './db/seedDatabase';

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './store/useAuth';
import { useData } from './store/useData';
import { Toaster } from 'sonner';

const ProtectedRoute = () => {
  const token = useAuth(state => state.token);
  const fetchBookmarks = useData(state => state.fetchBookmarks);

  useEffect(() => {
    if (token) {
      fetchBookmarks();
    }
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
};

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Keep dexie initialization for now if it's used elsewhere, otherwise we can remove it eventually
    initializeDatabase().then(() => {
      setIsInitializing(false);
    });
  }, []);

  if (isInitializing) {
    return <div className="h-screen w-screen flex items-center justify-center bg-black text-white">Loading...</div>;
  }

  return (
    <>
      <Toaster position="top-center" theme="dark" toastOptions={{ style: { background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '999px', fontFamily: 'Space Grotesk' } }} />
      <div className="scanlines" />
      <BrowserRouter>
        <Routes>
          <Route path="/t-display" element={<TDisplayPreview />} />
          <Route path="/t-display-nothing" element={<TDisplayNothingOS />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Home />} />
              <Route path="directory" element={<Directory />} />
              <Route path="bookmarks" element={<Bookmarks />} />
              <Route path="verse/:id" element={<VerseDetail />} />
              <Route path="display" element={<DisplayControl />} />
              <Route path="settings" element={<Settings />} />
              <Route path="memorize" element={<Memorize />} />
              <Route path="devices" element={<Devices />} />
              <Route path="manage" element={<Admin />} />
            </Route>
          </Route>
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
