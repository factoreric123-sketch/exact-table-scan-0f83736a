import { useEffect } from 'react';
import { Theme } from '@/lib/types/theme';
import { camelToKebab, loadGoogleFont } from '@/lib/fontUtils';

/**
 * Hook to apply theme preview instantly (<16ms latency)
 * Injects CSS custom properties into document.documentElement
 */
export const useThemePreview = (theme: Theme | null | undefined, enabled: boolean = true) => {
  useEffect(() => {
    if (!theme || !enabled) return;

    const root = document.documentElement;

    // Apply colors instantly
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${camelToKebab(key)}`, value);
    });

    // Apply corner radius
    root.style.setProperty('--radius', theme.visual.cornerRadius);

    // Apply mode class
    if (theme.visual.mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Load fonts dynamically
    loadGoogleFont(theme.fonts.heading);
    loadGoogleFont(theme.fonts.body);

    // Apply fonts via CSS variables
    root.style.setProperty('--font-heading', theme.fonts.heading);
    root.style.setProperty('--font-body', theme.fonts.body);

  }, [theme, enabled]);
};
