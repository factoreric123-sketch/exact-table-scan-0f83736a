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
    
    // Wrap everything in try-catch to prevent errors from crashing the app
    try {
      const normalized = normalizeTheme(theme);
      if (!normalized) return;

      // Check if document exists (for SSR safety)
      if (typeof document === 'undefined') return;

      const root = document.documentElement;
      if (!root) return;

      // Apply colors safely
      if (normalized.colors && typeof normalized.colors === 'object') {
        Object.entries(normalized.colors).forEach(([key, value]) => {
          try {
            if (value && root.style) {
              root.style.setProperty(`--${camelToKebab(key)}`, value as string);
            }
          } catch (err) {
            console.warn(`[useThemePreview] Failed to set color ${key}:`, err);
          }
        });
      }

      // Apply corner radius safely
      if (normalized.visual?.cornerRadius && root.style) {
        try {
          root.style.setProperty('--radius', normalized.visual.cornerRadius);
        } catch (err) {
          console.warn('[useThemePreview] Failed to set corner radius:', err);
        }
      }

      // Apply mode class safely
      if (root.classList) {
        try {
          if (normalized.visual?.mode === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
          } else {
            root.classList.add('light');
            root.classList.remove('dark');
          }
        } catch (err) {
          console.warn('[useThemePreview] Failed to set mode class:', err);
        }
      }

      // Load fonts safely
      if (normalized.fonts) {
        try {
          if (normalized.fonts.heading) {
            loadGoogleFont(normalized.fonts.heading);
            if (root.style) {
              root.style.setProperty('--font-heading', normalized.fonts.heading);
            }
          }
          if (normalized.fonts.body) {
            loadGoogleFont(normalized.fonts.body);
            if (root.style) {
              root.style.setProperty('--font-body', normalized.fonts.body);
            }
          }
        } catch (err) {
          console.warn('[useThemePreview] Failed to load fonts:', err);
        }
      }
    } catch (err) {
      console.error('[useThemePreview] Theme preview error:', err);
      // Don't rethrow - let the app continue without theme
    }
  }, [theme, enabled]);
};
