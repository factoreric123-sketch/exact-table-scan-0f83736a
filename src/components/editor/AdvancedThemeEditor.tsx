import { useState, useEffect } from 'react';
import { Theme } from '@/lib/types/theme';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useDebouncedCallback } from 'use-debounce';
import { getDefaultTheme } from '@/lib/presetThemes';

interface AdvancedThemeEditorProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
  onSaveCustom: (name: string) => void;
}

export const AdvancedThemeEditor = ({
  theme,
  onChange,
  onSaveCustom,
}: AdvancedThemeEditorProps) => {
  const [localTheme, setLocalTheme] = useState<Theme>(theme || getDefaultTheme());
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    if (theme) {
      setLocalTheme(theme);
    }
  }, [theme]);

  const debouncedOnChange = useDebouncedCallback((newTheme: Theme) => {
    onChange(newTheme);
  }, 300);

  const handleSimpleColorChange = (type: 'main' | 'secondary' | 'font', hslValue: string) => {
    let updatedColors = { ...localTheme.colors };
    
    if (type === 'main') {
      // Main color affects primary and accent
      updatedColors.primary = hslValue;
      updatedColors.accent = hslValue;
      updatedColors.ring = hslValue;
    } else if (type === 'secondary') {
      // Secondary color affects secondary, muted, and card backgrounds
      updatedColors.secondary = hslValue;
      updatedColors.muted = hslValue;
    } else if (type === 'font') {
      // Font color affects all foreground colors
      updatedColors.foreground = hslValue;
      updatedColors.cardForeground = hslValue;
      updatedColors.primaryForeground = adjustForContrast(hslValue);
      updatedColors.secondaryForeground = hslValue;
      updatedColors.accentForeground = hslValue;
      updatedColors.mutedForeground = adjustMutedForeground(hslValue);
    }
    
    const updatedTheme = { ...localTheme, colors: updatedColors };
    setLocalTheme(updatedTheme);
    debouncedOnChange(updatedTheme);
  };

  const adjustForContrast = (hsl: string): string => {
    const parts = hsl.split(' ');
    const l = parseInt(parts[2]);
    // If font is dark, primary foreground should be light, and vice versa
    return l > 50 ? '0 0% 10%' : '0 0% 98%';
  };

  const adjustMutedForeground = (hsl: string): string => {
    const parts = hsl.split(' ');
    const h = parts[0];
    const s = parseInt(parts[1]);
    const l = parseInt(parts[2]);
    // Make muted foreground slightly faded
    return `${h} ${Math.max(s - 20, 0)}% ${l > 50 ? Math.max(l - 25, 40) : Math.min(l + 25, 60)}%`;
  };

  const handleModeChange = (mode: 'light' | 'dark') => {
    const updatedTheme = {
      ...localTheme,
      visual: { ...localTheme.visual, mode },
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

  const simpleColors = [
    { label: 'Main Color', type: 'main' as const, value: localTheme.colors.primary },
    { label: 'Secondary Color', type: 'secondary' as const, value: localTheme.colors.secondary },
    { label: 'Font Color', type: 'font' as const, value: localTheme.colors.foreground },
  ];

  return (
    <div className="space-y-6 p-6">
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

      {/* Simple Color Pickers */}
      <div className="space-y-4">
        {simpleColors.map((color) => (
          <div key={color.type} className="flex items-center gap-4">
            <input
              type="color"
              value={hslToHex(color.value)}
              onChange={(e) => handleSimpleColorChange(color.type, hexToHsl(e.target.value))}
              className="h-12 w-20 rounded-lg border border-border cursor-pointer"
            />
            <Label className="text-base">{color.label}</Label>
          </div>
        ))}
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
  );
};
