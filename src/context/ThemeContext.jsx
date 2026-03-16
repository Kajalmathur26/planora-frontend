import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('planora_theme') || 'dark');
  const [accent, setAccent] = useState(() => localStorage.getItem('planora_accent') || 'violet');

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    localStorage.setItem('planora_theme', theme);
  }, [theme]);

  const ACCENT_COLORS = {
    violet: '261 83% 68%',
    indigo: '239 84% 67%',
    blue: '217 91% 60%',
    emerald: '160 84% 39%',
    rose: '346 87% 60%',
    amber: '45 93% 47%'
  };

  useEffect(() => {
    localStorage.setItem('planora_accent', accent);
    const color = ACCENT_COLORS[accent] || ACCENT_COLORS.violet;
    document.documentElement.style.setProperty('--primary', color);
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--ring', color);
  }, [accent]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
