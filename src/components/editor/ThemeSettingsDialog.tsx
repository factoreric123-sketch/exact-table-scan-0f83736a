import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useUpdateRestaurant, type Restaurant } from "@/hooks/useRestaurants";
import { toast } from "sonner";

interface ThemeSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant;
}

export const ThemeSettingsDialog = ({
  open,
  onOpenChange,
  restaurant,
}: ThemeSettingsDialogProps) => {
  const updateRestaurant = useUpdateRestaurant();
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const [primaryColor, setPrimaryColor] = useState("#ffffff");
  const [cornerRadius, setCornerRadius] = useState(0.5);

  useEffect(() => {
    if (restaurant.theme) {
      setMode(restaurant.theme.visual?.mode || "dark");
      setPrimaryColor(restaurant.theme.colors?.primary ? `hsl(${restaurant.theme.colors.primary})` : "#ffffff");
      // Parse cornerRadius from theme (e.g., "0.5rem" -> 0.5)
      const radiusStr = restaurant.theme.visual?.cornerRadius || "0.5rem";
      const radiusValue = parseFloat(radiusStr) || 0.5;
      setCornerRadius(radiusValue);
    }
  }, [restaurant.theme]);

  const handleSave = async () => {
    try {
      // Convert the primary color back to HSL string without "hsl()" wrapper
      const hslMatch = primaryColor.match(/hsl\(([^)]+)\)/);
      const hslValue = hslMatch ? hslMatch[1] : primaryColor;
      
      await updateRestaurant.mutateAsync({
        id: restaurant.id,
        updates: {
          theme: {
            ...restaurant.theme,
            visual: {
              ...restaurant.theme?.visual,
              mode,
              cornerRadius: `${cornerRadius}rem`,
            },
            colors: {
              ...restaurant.theme?.colors,
              primary: hslValue,
            },
          } as any,
        },
      });
      toast.success("Theme updated");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update theme");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Theme Settings</DialogTitle>
          <DialogDescription>
            Customize the look and feel of your restaurant menu
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Mode</Label>
            <div className="flex gap-2">
              <Button
                variant={mode === "dark" ? "default" : "outline"}
                onClick={() => setMode("dark")}
                className="flex-1"
              >
                Dark
              </Button>
              <Button
                variant={mode === "light" ? "default" : "outline"}
                onClick={() => setMode("light")}
                className="flex-1"
              >
                Light
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex gap-3 items-center">
              <input
                id="primary-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-20 rounded border border-border cursor-pointer"
              />
              <div className="flex-1 px-3 py-2 rounded border border-border bg-muted text-sm font-mono">
                {primaryColor}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Corner Radius</Label>
            <Slider
              value={[cornerRadius]}
              onValueChange={([value]) => setCornerRadius(value)}
              min={0}
              max={2}
              step={0.1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">{cornerRadius}rem</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Theme
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
