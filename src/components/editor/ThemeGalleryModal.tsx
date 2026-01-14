import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Theme } from '@/lib/types/theme';
import { presetThemes, getDefaultTheme } from '@/lib/presetThemes';
import { ThemePreviewCard } from './ThemePreviewCard';
import { AdvancedThemeEditor } from './AdvancedThemeEditor';
import { useThemePreview } from '@/hooks/useThemePreview';
import { useUserThemes, useCreateUserTheme, useDeleteUserTheme } from '@/hooks/useUserThemes';
import { useUpdateRestaurant } from '@/hooks/useRestaurants';
import { Restaurant } from '@/hooks/useRestaurants';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [customTheme, setCustomTheme] = useState<Theme>(activeTheme);

  const updateRestaurant = useUpdateRestaurant();
  const { data: userThemes = [], isLoading: userThemesLoading } = useUserThemes();
  const createUserTheme = useCreateUserTheme();
  const deleteUserTheme = useDeleteUserTheme();

  // Live preview hook (only preview when hovering, not the active theme)
  useThemePreview(previewTheme, open && previewTheme !== null);

  useEffect(() => {
    if (restaurant.theme) {
      setActiveTheme(restaurant.theme);
      setCustomTheme(restaurant.theme);
    }
  }, [restaurant.theme]);

  // Debounced hover preview (150ms delay)
  const debouncedSetPreview = useDebouncedCallback((theme: Theme) => {
    setPreviewTheme(theme);
  }, 150);

  const handleThemeHover = (theme: Theme) => {
    debouncedSetPreview(theme);
  };

  const handleThemeClick = async (theme: Theme) => {
    try {
      setActiveTheme(theme);
      setCustomTheme(theme);
      setPreviewTheme(null); // Clear preview

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

  const handleAdvancedThemeChange = (theme: Theme) => {
    setCustomTheme(theme);
    setPreviewTheme(theme); // Show live preview
  };

  const handleApplyCustomTheme = async () => {
    await handleThemeClick(customTheme);
  };

  const handleSaveCustomTheme = async (name: string) => {
    const themeToSave = {
      ...customTheme,
      id: `custom-${Date.now()}`,
      name,
      isCustom: true,
    };

    try {
      await createUserTheme.mutateAsync({
        name,
        theme: themeToSave,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteCustomTheme = async (themeId: string) => {
    try {
      await deleteUserTheme.mutateAsync(themeId);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleMouseLeave = () => {
    debouncedSetPreview.cancel();
    setPreviewTheme(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Theme Gallery</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preset" className="flex-1 flex flex-col">
          <TabsList className="mx-6">
            <TabsTrigger value="preset">Preset Themes</TabsTrigger>
            <TabsTrigger value="my-themes">My Themes</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(90vh-10rem)]">
              <div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6"
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
          </TabsContent>

          <TabsContent value="my-themes" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(90vh-10rem)]">
              {userThemesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : userThemes.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    No custom themes yet. Create one in the Advanced tab!
                  </p>
                </div>
              ) : (
                <div
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6"
                  onMouseLeave={handleMouseLeave}
                >
                  {userThemes.map((userTheme) => (
                    <div key={userTheme.id} className="relative">
                      <ThemePreviewCard
                        theme={userTheme.theme_data}
                        isActive={activeTheme.id === userTheme.theme_data.id}
                        onHover={() => handleThemeHover(userTheme.theme_data)}
                        onClick={() => handleThemeClick(userTheme.theme_data)}
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 left-2 h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomTheme(userTheme.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="advanced" className="flex-1 mt-0 flex flex-col">
            <AdvancedThemeEditor
              theme={customTheme}
              onChange={handleAdvancedThemeChange}
              onSaveCustom={handleSaveCustomTheme}
            />
            <div className="p-6 border-t flex gap-2">
              <Button variant="outline" onClick={() => setCustomTheme(activeTheme)} className="flex-1">
                Reset
              </Button>
              <Button onClick={handleApplyCustomTheme} className="flex-1">
                Apply Theme
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
