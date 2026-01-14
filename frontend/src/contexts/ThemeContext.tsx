import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'alphastar_theme';
const TRANSITION_DURATION = 300; // ms - matches CSS transition duration

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_KEY) as Theme;
      if (stored) return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });
  
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Apply theme class and handle smooth transitions
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Handle smooth theme transition with transitioning class
  const applyThemeWithTransition = useCallback((newTheme: Theme) => {
    const root = window.document.documentElement;
    
    // Add transitioning class to enable smooth transitions on all elements
    root.classList.add('transitioning');
    setIsTransitioning(true);
    
    // Apply the new theme
    setThemeState(newTheme);
    
    // Remove transitioning class after animation completes
    setTimeout(() => {
      root.classList.remove('transitioning');
      setIsTransitioning(false);
    }, TRANSITION_DURATION);
  }, []);

  const toggleTheme = useCallback(() => {
    applyThemeWithTransition(theme === 'light' ? 'dark' : 'light');
  }, [theme, applyThemeWithTransition]);

  const setTheme = useCallback((newTheme: Theme) => {
    if (newTheme !== theme) {
      applyThemeWithTransition(newTheme);
    }
  }, [theme, applyThemeWithTransition]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isTransitioning }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
