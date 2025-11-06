import { useEffect } from 'react';
import { Theme } from '@/lib/types/theme';
import { camelToKebab, loadGoogleFont } from '@/lib/fontUtils';
import { getDefaultTheme } from '@/lib/presetThemes';

// Normalize legacy theme objects from DB into the current Theme shape
function normalizeTheme(raw: any): Theme | null {
  if (!raw) return null;

  // Already in new format
  if (raw.colors && raw.fonts && raw.visual) {
    return raw as Theme;
  }

  // Legacy format handling: { mode: 'dark' | 'light', primaryColor?: 'hsl(…)' }
  const base = getDefaultTheme();

  const toToken = (value?: string): string | undefined => {
    if (!value) return undefined;
    const v = value.trim();
    if (v.startsWith('hsl(')) {
      const inner = v.slice(v.indexOf('(') + 1, v.lastIndexOf(')'));
      // Remove commas to match "H S% L%" tokens
      return inner.replace(/,/g, '').trim();
    }
    return v;
  };

  const mode = raw.mode === 'light' ? 'light' : 'dark';
  const primary = toToken(raw.primaryColor);

  const normalized: Theme = {
    ...base,
    visual: {
      ...base.visual,
      mode,
    },
    colors: {
      ...base.colors,
      ...(primary ? { primary, ring: primary, accent: primary } : {}),
    },
    // keep base fonts
  };

  return normalized;
}

/**
 * Hook to apply theme preview safely with legacy support
 */
export const useThemePreview = (theme: Theme | any | null | undefined, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const normalized = normalizeTheme(theme);
    if (!normalized) return;

    const root = document.documentElement;

    // Apply colors
    Object.entries(normalized.colors).forEach(([key, value]) => {
      if (value) root.style.setProperty(`--${camelToKebab(key)}`, value as string);
    });

    // Apply corner radius
    root.style.setProperty('--radius', normalized.visual.cornerRadius);

    // Apply mode class
    if (normalized.visual.mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Load fonts dynamically
    loadGoogleFont(normalized.fonts.heading);
    loadGoogleFont(normalized.fonts.body);

    // Apply fonts via CSS variables
    root.style.setProperty('--font-heading', normalized.fonts.heading);
    root.style.setProperty('--font-body', normalized.fonts.body);

  }, [theme, enabled]);
};
