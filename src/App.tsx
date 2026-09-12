import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import Library from './pages/Library';
import VerseDetail from './pages/VerseDetail';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Memorize from './pages/Memorize';
import TDisplayPreview from './pages/TDisplayPreview';
import TDisplayNothingOS from './pages/TDisplayNothingOS';
import DisplayControl from './pages/DisplayControl';
import { initializeDatabase } from './db/seedDatabase';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeDatabase().then(() => {
      setIsInitializing(false);
    });
  }, []);

  if (isInitializing) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#F9F6F0]">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/t-display" element={<TDisplayPreview />} />
        <Route path="/t-display-nothing" element={<TDisplayNothingOS />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="library" element={<Library />} />
          <Route path="verse/:id" element={<VerseDetail />} />
          <Route path="progress" element={<Progress />} />
          <Route path="display" element={<DisplayControl />} />
          <Route path="settings" element={<Settings />} />
          <Route path="memorize" element={<Memorize />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
