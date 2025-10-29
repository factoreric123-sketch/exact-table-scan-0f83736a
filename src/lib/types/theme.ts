export interface Theme {
  id: string;
  name: string;
  isCustom: boolean;
  colors: {
    // Base colors (HSL format for CSS variables - no "hsl()" wrapper)
    background: string;        // e.g., "0 0% 6%"
    foreground: string;        // e.g., "0 0% 98%"
    card: string;              // e.g., "0 0% 10%"
    cardForeground: string;    // e.g., "0 0% 98%"
    primary: string;           // e.g., "0 0% 98%"
    primaryForeground: string; // e.g., "0 0% 6%"
    secondary: string;         // e.g., "0 0% 15%"
    secondaryForeground: string;
    accent: string;            // e.g., "160 84% 39%"
    accentForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;
    destructive: string;
    destructiveForeground: string;
  };
  fonts: {
    heading: string;           // e.g., "Playfair Display"
    body: string;              // e.g., "Inter"
  };
  visual: {
    mode: 'light' | 'dark';
    cornerRadius: string;      // e.g., "0.75rem"
  };
}

export interface UserTheme {
  id: string;
  user_id: string;
  name: string;
  theme_data: Theme;
  created_at: string;
  updated_at: string;
}
