import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('planora_theme') || 'dark');
  const [accent, setAccent] = useState(() => localStorage.getItem('planora_accent') || 'violet');

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    localStorage.setItem('planora_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('planora_accent', accent);
  }, [accent]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
