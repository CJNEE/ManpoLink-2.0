import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

type ThemeContextValue = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialDark(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('theme');
  if (saved) return saved === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(dark: boolean) {
  const root = document.documentElement;
  if (dark) {
    root.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    root.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(readInitialDark);

  useEffect(() => {
    applyTheme(isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({ isDarkMode, toggleDarkMode }),
    [isDarkMode, toggleDarkMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

/** Light/dark switch (same behavior as previous Layout control). */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative w-14 h-7 shrink-0 flex items-center rounded-full p-1
        ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}
        ${className}`}
    >
      <div
        className={`absolute inset-0 rounded-full blur-md opacity-40 pointer-events-none
          ${isDarkMode ? 'bg-blue-500' : 'bg-yellow-300'}
        `}
      />
      <motion.div
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="relative z-10 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center"
        animate={{ x: isDarkMode ? 28 : 0 }}
      >
        {isDarkMode ? (
          <Moon size={12} className="text-blue-500" />
        ) : (
          <Sun size={12} className="text-yellow-500" />
        )}
      </motion.div>
    </button>
  );
}
