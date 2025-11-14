import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Restaurant } from "@/hooks/useRestaurants";
import { useUpdateRestaurant } from "@/hooks/useRestaurants";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Loader2 } from "lucide-react";

interface RestaurantSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant;
  onFilterToggle: () => void;
  onSettingsUpdate: () => void;
}

export const RestaurantSettingsDialog = ({
  open,
  onOpenChange,
  restaurant,
  onFilterToggle,
  onSettingsUpdate,
}: RestaurantSettingsDialogProps) => {
  const updateRestaurant = useUpdateRestaurant();
  const [badgeColors, setBadgeColors] = useState(
    restaurant.badge_colors || {
      new_addition: "34, 197, 94",
      special: "249, 115, 22",
      popular: "6, 182, 212",
      chef_recommendation: "59, 130, 246",
    }
  );

  // Sync badge colors when restaurant prop changes
  useEffect(() => {
    if (restaurant.badge_colors) {
      setBadgeColors(restaurant.badge_colors);
    }
  }, [restaurant.badge_colors]);

  // Debounced update function for instant UI feedback
  const debouncedUpdate = useDebouncedCallback(
    async (field: string, value: any) => {
      try {
        await updateRestaurant.mutateAsync({
          id: restaurant.id,
          updates: { [field]: value },
        });
        onSettingsUpdate();
      } catch (error) {
        console.error("Error updating setting:", error);
      }
    },
    300
  );

  const updateSetting = (field: string, value: any) => {
    debouncedUpdate(field, value);
  };

  const updateBadgeColor = (badge: string, rgb: string) => {
    const newColors = { ...badgeColors, [badge]: rgb };
    setBadgeColors(newColors);
    updateSetting("badge_colors", newColors);
  };

  const isUpdating = updateRestaurant.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Restaurant Settings
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Visibility Options */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Visibility Options</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-prices" className="text-base">
                    Show Prices
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display prices on menu (hide for special events or wine lists)
                  </p>
                </div>
                <Switch
                  id="show-prices"
                  checked={restaurant.show_prices !== false}
                  onCheckedChange={(checked) => updateSetting("show_prices", checked)}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-images" className="text-base">
                    Show Images
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display dish images (disable for text-only menu)
                  </p>
                </div>
                <Switch
                  id="show-images"
                  checked={restaurant.show_images !== false}
                  onCheckedChange={(checked) => updateSetting("show_images", checked)}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="filter-toggle" className="text-base">
                    Show Filter Options
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to filter by allergens and dietary preferences
                  </p>
                </div>
                <Switch
                  id="filter-toggle"
                  checked={restaurant.show_allergen_filter !== false}
                  onCheckedChange={(checked) => {
                    updateSetting("show_allergen_filter", checked);
                    onFilterToggle();
                  }}
                  disabled={isUpdating}
                />
              </div>
            </div>
          </div>
          
          <Separator />

          {/* Layout Options */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Layout Options</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-base mb-2 block">Grid Columns</Label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((cols) => (
                    <Button
                      key={cols}
                      variant={restaurant.grid_columns === cols ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSetting("grid_columns", cols)}
                      disabled={isUpdating}
                    >
                      {cols} Column{cols > 1 ? 's' : ''}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base mb-2 block">Layout Density</Label>
                <div className="flex gap-2">
                  {['compact', 'spacious'].map((density) => (
                    <Button
                      key={density}
                      variant={restaurant.layout_density === density ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSetting("layout_density", density)}
                      className="capitalize"
                      disabled={isUpdating}
                    >
                      {density}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base mb-2 block">Image Size</Label>
                <div className="flex gap-2">
                  {['compact', 'large'].map((size) => (
                    <Button
                      key={size}
                      variant={restaurant.image_size === size ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSetting("image_size", size)}
                      className="capitalize"
                      disabled={isUpdating}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base mb-2 block">Font Size</Label>
                <div className="flex gap-2">
                  {['small', 'medium', 'large'].map((size) => (
                    <Button
                      key={size}
                      variant={restaurant.menu_font_size === size ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSetting("menu_font_size", size)}
                      className="capitalize"
                      disabled={isUpdating}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <Separator />

          {/* Badge Colors */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Badge Colors</h3>
            <div className="space-y-3">
              {[
                { key: 'new_addition', label: 'New Addition' },
                { key: 'special', label: 'Special' },
                { key: 'popular', label: 'Popular' },
                { key: 'chef_recommendation', label: "Chef's Recommendation" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <Label className="text-sm w-40">{label}</Label>
                  <div className="flex items-center gap-2 flex-1">
                    <div 
                      className="w-8 h-8 rounded border border-border"
                      style={{ backgroundColor: `rgb(${badgeColors[key as keyof typeof badgeColors]})` }}
                    />
                    <Input
                      type="text"
                      placeholder="R, G, B (e.g., 34, 197, 94)"
                      value={badgeColors[key as keyof typeof badgeColors]}
                      onChange={(e) => updateBadgeColor(key, e.target.value)}
                      className="text-sm"
                      disabled={isUpdating}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">
                Enter RGB values separated by commas (e.g., 255, 100, 50)
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
