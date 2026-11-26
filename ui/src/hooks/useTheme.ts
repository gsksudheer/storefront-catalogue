import { useCallback, useState } from 'react';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'theme';

const current = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

/**
 * Initial theme is resolved before first paint by the inline script in index.html
 * (saved choice, else OS preference). This hook just reads and flips it.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current);
  const toggle = useCallback(() => {
    const next: Theme = current() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode: theme still applies for this visit */
    }
    setTheme(next);
  }, []);
  return { theme, toggle };
}
