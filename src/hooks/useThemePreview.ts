import { useEffect, useRef } from 'react';
import { Theme } from '@/lib/types/theme';
import { camelToKebab } from '@/lib/fontUtils';
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
 * Hook to apply theme preview to a SCOPED container element
 * This version applies to a specific element, not the document root
 * Used for live preview in the Theme Gallery Modal
 * 
 * @param theme - Theme to preview
 * @param enabled - Whether to apply the preview
 * @param containerRef - Optional ref to a container element (defaults to .menu-theme-scope)
 */
export const useThemePreview = (
  theme: Theme | any | null | undefined, 
  enabled: boolean = true,
  containerRef?: React.RefObject<HTMLElement>
) => {
  const previousStyles = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!enabled) return;
    
    try {
      const normalized = normalizeTheme(theme);
      if (!normalized) return;

      if (typeof document === 'undefined') return;

      // Find the menu theme scope container(s)
      const containers = containerRef?.current 
        ? [containerRef.current]
        : document.querySelectorAll('.menu-theme-scope');

      if (containers.length === 0) return;

      containers.forEach((container) => {
        if (!(container instanceof HTMLElement)) return;

        // Apply colors
        if (normalized.colors && typeof normalized.colors === 'object') {
          Object.entries(normalized.colors).forEach(([key, value]) => {
            try {
              if (value) {
                container.style.setProperty(`--${camelToKebab(key)}`, value as string);
              }
            } catch (err) {
              console.warn(`[useThemePreview] Failed to set color ${key}:`, err);
            }
          });
        }

        // Apply corner radius
        if (normalized.visual?.cornerRadius) {
          try {
            container.style.setProperty('--radius', normalized.visual.cornerRadius);
          } catch (err) {
            console.warn('[useThemePreview] Failed to set corner radius:', err);
          }
        }

        // Apply mode class
        try {
          if (normalized.visual?.mode === 'dark') {
            container.classList.add('dark');
            container.classList.remove('light');
          } else {
            container.classList.add('light');
            container.classList.remove('dark');
          }
        } catch (err) {
          console.warn('[useThemePreview] Failed to set mode class:', err);
        }
      });

    } catch (err) {
      console.error('[useThemePreview] Theme preview error:', err);
    }
  }, [theme, enabled, containerRef]);
};
