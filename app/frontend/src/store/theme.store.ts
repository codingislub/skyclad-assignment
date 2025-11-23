import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme: 'light' | 'dark') => {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      effectiveTheme: getSystemTheme(),

      setTheme: (theme: Theme) => {
        const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
        applyTheme(effectiveTheme);
        set({ theme, effectiveTheme });
      },

      initTheme: () => {
        const { theme } = get();
        const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
        applyTheme(effectiveTheme);
        set({ effectiveTheme });

        // Listen for system theme changes
        if (typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          
          const handleChange = (e: MediaQueryListEvent) => {
            const { theme } = get();
            if (theme === 'system') {
              const newEffectiveTheme = e.matches ? 'dark' : 'light';
              applyTheme(newEffectiveTheme);
              set({ effectiveTheme: newEffectiveTheme });
            }
          };

          mediaQuery.addEventListener('change', handleChange);
          
          // Cleanup
          return () => mediaQuery.removeEventListener('change', handleChange);
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
