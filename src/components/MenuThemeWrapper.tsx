import { ReactNode, useMemo } from 'react';
import { Theme } from '@/lib/types/theme';
import { getDefaultTheme } from '@/lib/presetThemes';
import { camelToKebab } from '@/lib/fontUtils';

interface MenuThemeWrapperProps {
  theme: Theme | any | null | undefined;
  children: ReactNode;
  className?: string;
}

/**
 * Scoped theme wrapper - applies theme ONLY to menu content areas
 * Does NOT affect the app header, toolbar, dashboard, or other UI
 * Each restaurant/menu has its own theme applied via this wrapper
 */
export const MenuThemeWrapper = ({ theme, children, className = '' }: MenuThemeWrapperProps) => {
  // Normalize legacy theme formats
  const normalizedTheme = useMemo(() => {
    if (!theme) return getDefaultTheme();

    // Already in new format
    if (theme.colors && theme.fonts && theme.visual) {
      return theme as Theme;
    }

    // Legacy format: { mode, primaryColor }
    const base = getDefaultTheme();
    const mode = theme.mode === 'light' ? 'light' : 'dark';
    
    const toToken = (value?: string): string | undefined => {
      if (!value) return undefined;
      const v = value.trim();
      if (v.startsWith('hsl(')) {
        const inner = v.slice(v.indexOf('(') + 1, v.lastIndexOf(')'));
        return inner.replace(/,/g, '').trim();
      }
      return v;
    };

    const primary = toToken(theme.primaryColor);

    return {
      ...base,
      visual: { ...base.visual, mode },
      colors: {
        ...base.colors,
        ...(primary ? { primary, ring: primary, accent: primary } : {}),
      },
    } as Theme;
  }, [theme]);

  // Generate inline CSS variables for scoped theming
  const themeStyles = useMemo(() => {
    const styles: Record<string, string> = {};

    if (normalizedTheme.colors) {
      Object.entries(normalizedTheme.colors).forEach(([key, value]) => {
        if (value) {
          styles[`--${camelToKebab(key)}`] = value as string;
        }
      });
    }

    if (normalizedTheme.visual?.cornerRadius) {
      styles['--radius'] = normalizedTheme.visual.cornerRadius;
    }

    return styles;
  }, [normalizedTheme]);

  // Determine the mode class
  const modeClass = normalizedTheme.visual?.mode === 'light' ? 'light' : 'dark';

  return (
    <div
      className={`menu-theme-scope ${modeClass} ${className}`}
      style={themeStyles}
    >
      {children}
    </div>
  );
};
