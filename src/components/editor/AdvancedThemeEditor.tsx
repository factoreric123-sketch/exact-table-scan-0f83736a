import { useState, useEffect } from 'react';
import { Theme } from '@/lib/types/theme';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useDebouncedCallback } from 'use-debounce';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdvancedThemeEditorProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
  onSaveCustom: (name: string) => void;
}

const fonts = [
  'Playfair Display', 'Lora', 'Crimson Text', 'Merriweather', 'Cormorant Garamond',
  'Libre Baskerville', 'Source Serif 4', 'Spectral', 'Inter', 'Montserrat',
  'Raleway', 'Open Sans', 'Roboto', 'Lato', 'Nunito', 'Work Sans',
  'Poppins', 'Quicksand', 'Barlow', 'DM Sans',
];

export const AdvancedThemeEditor = ({
  theme,
  onChange,
  onSaveCustom,
}: AdvancedThemeEditorProps) => {
  const [localTheme, setLocalTheme] = useState<Theme>(theme);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  // Debounce onChange to prevent excessive updates
  const debouncedOnChange = useDebouncedCallback((newTheme: Theme) => {
    onChange(newTheme);
  }, 300);

  const handleColorChange = (colorKey: keyof Theme['colors'], hslValue: string) => {
    const updatedTheme = {
      ...localTheme,
      colors: {
        ...localTheme.colors,
        [colorKey]: hslValue,
      },
    };
    setLocalTheme(updatedTheme);
    debouncedOnChange(updatedTheme);
  };

  const handleFontChange = (fontType: 'heading' | 'body', fontFamily: string) => {
    const updatedTheme = {
      ...localTheme,
      fonts: {
        ...localTheme.fonts,
        [fontType]: fontFamily,
      },
    };
    setLocalTheme(updatedTheme);
    debouncedOnChange(updatedTheme);
  };

  const handleModeChange = (mode: 'light' | 'dark') => {
    const updatedTheme = {
      ...localTheme,
      visual: {
        ...localTheme.visual,
        mode,
      },
    };
    setLocalTheme(updatedTheme);
    debouncedOnChange(updatedTheme);
  };

  const handleRadiusChange = (value: number[]) => {
    const updatedTheme = {
      ...localTheme,
      visual: {
        ...localTheme.visual,
        cornerRadius: `${value[0]}rem`,
      },
    };
    setLocalTheme(updatedTheme);
    debouncedOnChange(updatedTheme);
  };

  const hslToHex = (hsl: string): string => {
    const parts = hsl.split(' ');
    const h = parseInt(parts[0]);
    const s = parseInt(parts[1]);
    const l = parseInt(parts[2]);

    const hue = h / 360;
    const sat = s / 100;
    const light = l / 100;

    let r, g, b;
    if (sat === 0) {
      r = g = b = light;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
      const p = 2 * light - q;
      r = hue2rgb(p, q, hue + 1 / 3);
      g = hue2rgb(p, q, hue);
      b = hue2rgb(p, q, hue - 1 / 3);
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const colorGroups = [
    { label: 'Background', keys: ['background', 'foreground'] as const },
    { label: 'Card', keys: ['card', 'cardForeground'] as const },
    { label: 'Primary', keys: ['primary', 'primaryForeground'] as const },
    { label: 'Secondary', keys: ['secondary', 'secondaryForeground'] as const },
    { label: 'Accent', keys: ['accent', 'accentForeground'] as const },
    { label: 'Muted', keys: ['muted', 'mutedForeground'] as const },
    { label: 'Other', keys: ['border', 'input', 'ring'] as const },
  ];

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="space-y-8 p-6">
        {/* Mode Selection */}
        <div className="space-y-3">
          <Label>Mode</Label>
          <RadioGroup
            value={localTheme.visual.mode}
            onValueChange={(value) => handleModeChange(value as 'light' | 'dark')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light">Light</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark">Dark</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Color Groups */}
        {colorGroups.map((group) => (
          <div key={group.label} className="space-y-3">
            <Label className="text-base font-semibold">{group.label}</Label>
            <div className="space-y-2">
              {group.keys.map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={hslToHex(localTheme.colors[key])}
                    onChange={(e) => handleColorChange(key, hexToHsl(e.target.value))}
                    className="h-10 w-16 rounded border border-border cursor-pointer"
                  />
                  <Label className="flex-1 capitalize text-sm">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Fonts */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Fonts</Label>
          <div className="space-y-3">
            <div>
              <Label className="text-sm mb-2 block">Heading Font</Label>
              <Select
                value={localTheme.fonts.heading}
                onValueChange={(value) => handleFontChange('heading', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fonts.map((font) => (
                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Body Font</Label>
              <Select
                value={localTheme.fonts.body}
                onValueChange={(value) => handleFontChange('body', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fonts.map((font) => (
                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Corner Radius */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Corner Radius</Label>
          <div className="space-y-2">
            <Slider
              value={[parseFloat(localTheme.visual.cornerRadius)]}
              onValueChange={handleRadiusChange}
              max={2}
              step={0.25}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">{localTheme.visual.cornerRadius}</p>
          </div>
        </div>

        {/* Save Custom Theme */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-base font-semibold">Save as Custom Theme</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Theme name..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
            <Button
              onClick={() => {
                if (customName.trim()) {
                  onSaveCustom(customName.trim());
                  setCustomName('');
                }
              }}
              disabled={!customName.trim()}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
