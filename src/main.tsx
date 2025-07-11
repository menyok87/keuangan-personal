import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useDarkMode } from './hooks/useDarkMode';

// DarkModeInitializer component to set up dark mode on initial render
function DarkModeInitializer() {
  const { isDarkMode } = useDarkMode();
  
  useEffect(() => {
    // This effect runs once on mount to set the initial dark mode class
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