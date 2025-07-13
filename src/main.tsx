import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useDarkMode } from './hooks/useDarkMode';

function DarkModeInitializer() {
  const { isDarkMode } = useDarkMode();
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DarkModeInitializer />
  </StrictMode>
);