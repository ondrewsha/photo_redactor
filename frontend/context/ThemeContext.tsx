
import React, { createContext, useContext, useLayoutEffect, useState } from 'react';
import { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem('nv_theme');
  return stored === 'dark' ? 'dark' : 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [isDark, setIsDark] = useState(theme === 'dark');

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('nv_theme', newTheme);
    }
  };

  useLayoutEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;

    const actualIsDark = theme === 'dark';
    setIsDark(actualIsDark);

    root.dataset.theme = theme;
    body.dataset.theme = theme;

    root.classList.toggle('dark', actualIsDark);
    root.classList.toggle('light', !actualIsDark);
    body.classList.toggle('dark', actualIsDark);
    body.classList.toggle('light', !actualIsDark);

    root.style.colorScheme = actualIsDark ? 'dark' : 'light';
    body.style.colorScheme = actualIsDark ? 'dark' : 'light';
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
