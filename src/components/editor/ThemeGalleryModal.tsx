import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Theme } from '@/lib/types/theme';
import { presetThemes, getDefaultTheme } from '@/lib/presetThemes';
import { ThemePreviewCard } from './ThemePreviewCard';
import { useThemePreview } from '@/hooks/useThemePreview';
import { useUpdateRestaurant } from '@/hooks/useRestaurants';
import { Restaurant } from '@/hooks/useRestaurants';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';

interface ThemeGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant;
  onThemeChange?: (theme: Theme) => void;
}

export const ThemeGalleryModal = ({
  open,
  onOpenChange,
  restaurant,
  onThemeChange,
}: ThemeGalleryModalProps) => {
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
  const [activeTheme, setActiveTheme] = useState<Theme>(
    restaurant.theme || getDefaultTheme()
  );

  const updateRestaurant = useUpdateRestaurant();

  // Apply theme preview to scoped menu containers only (not the whole app)
  useThemePreview(previewTheme, open && previewTheme !== null);

  useEffect(() => {
    if (restaurant.theme) {
      setActiveTheme(restaurant.theme);
    }
  }, [restaurant.theme]);

  const debouncedSetPreview = useDebouncedCallback((theme: Theme) => {
    setPreviewTheme(theme);
  }, 150);

  const handleThemeHover = (theme: Theme) => {
    debouncedSetPreview(theme);
  };

  const handleThemeClick = async (theme: Theme) => {
    try {
      setActiveTheme(theme);
      setPreviewTheme(null);

      await updateRestaurant.mutateAsync({
        id: restaurant.id,
        updates: { theme: theme as any },
      });

      onThemeChange?.(theme);
      toast.success('Theme applied!');
    } catch (error) {
      toast.error('Failed to apply theme');
    }
  };

  const handleMouseLeave = () => {
    debouncedSetPreview.cancel();
    setPreviewTheme(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Choose a Theme for This Menu</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(80vh-6rem)]">
          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6 pt-0"
            onMouseLeave={handleMouseLeave}
          >
            {presetThemes.map((theme) => (
              <ThemePreviewCard
                key={theme.id}
                theme={theme}
                isActive={activeTheme.id === theme.id}
                onHover={() => handleThemeHover(theme)}
                onClick={() => handleThemeClick(theme)}
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
