// Font utility functions for dynamic font loading and application

const loadedFonts = new Set<string>();

export const fontMap: Record<string, string> = {
  'Playfair Display': 'playfair',
  'Lora': 'lora',
  'Crimson Text': 'crimson',
  'Merriweather': 'merriweather',
  'Cormorant Garamond': 'cormorant',
  'Libre Baskerville': 'libre',
  'Source Serif 4': 'source-serif',
  'Spectral': 'spectral',
  'Inter': 'inter',
  'Montserrat': 'montserrat',
  'Raleway': 'raleway',
  'Open Sans': 'open-sans',
  'Roboto': 'roboto',
  'Lato': 'lato',
  'Nunito': 'nunito',
  'Work Sans': 'work-sans',
  'Poppins': 'poppins',
  'Quicksand': 'quicksand',
  'Barlow': 'barlow',
  'DM Sans': 'dm-sans',
};

/**
 * Convert font family name to Tailwind class name
 * @example "Playfair Display" → "font-playfair"
 */
export const getFontClassName = (fontFamily: string): string => {
  const className = fontMap[fontFamily];
  return className ? `font-${className}` : 'font-inter';
};

/**
 * Convert camelCase to kebab-case for CSS custom properties
 */
export const camelToKebab = (str: string): string => {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
};

/**
 * Dynamically load a Google Font if not already loaded
 */
export const loadGoogleFont = (fontFamily: string): void => {
  if (loadedFonts.has(fontFamily)) return;

  // Check if font is already in the document
  const existingLink = document.querySelector(`link[href*="${fontFamily.replace(/\s+/g, '+')}"]`);
  if (existingLink) {
    loadedFonts.add(fontFamily);
    return;
  }

  // All fonts are preloaded in index.html, so just mark as loaded
  loadedFonts.add(fontFamily);
};

/**
 * Apply font to specific elements
 */
export const applyFontToElements = (selector: string, fontFamily: string): void => {
  const elements = document.querySelectorAll(selector);
  const fontClassName = getFontClassName(fontFamily);
  
  elements.forEach((element) => {
    // Remove existing font classes
    element.className = element.className
      .split(' ')
      .filter((cls) => !cls.startsWith('font-'))
      .join(' ');
    
    // Add new font class
    element.classList.add(fontClassName);
  });
};
