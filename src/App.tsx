import { useState, useEffect } from 'react';
import { Wizard } from './components/wizard/Wizard';
import { Toaster } from './components/ui/toaster';

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('tuntas-pro-dark');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('tuntas-pro-dark', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem('tuntas-pro-dark');
      if (stored === null) setDarkMode(e.matches);
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  return (
    <>
      <Wizard darkMode={darkMode} onToggleDark={() => setDarkMode((v) => !v)} />
      <Toaster />
    </>
  );
}

export default App;
