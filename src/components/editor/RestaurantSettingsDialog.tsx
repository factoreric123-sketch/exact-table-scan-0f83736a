import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Restaurant } from "@/hooks/useRestaurants";
import { useUpdateRestaurant } from "@/hooks/useRestaurants";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Loader2, Square, RectangleVertical, Upload, Download } from "lucide-react";
import { menuFontOptions, getFontClassName } from "@/lib/fontUtils";

interface RestaurantSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant;
  onFilterToggle: () => void;
  onSettingsUpdate: () => void;
  onImportData?: (data: any[]) => void;
}

export const RestaurantSettingsDialog = ({
  open,
  onOpenChange,
  restaurant,
  onFilterToggle,
  onSettingsUpdate,
  onImportData,
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

  const handleExampleImport = () => {
    try {
      const templateData = [
        {
          Category: "Appetizers",
          Subcategory: "Starters",
          Name: "Example Dish",
          Description: "A delicious example dish",
          Price: "12.99",
          Calories: 350,
          Allergens: "gluten, dairy",
          Vegetarian: "No",
          Vegan: "No",
          Spicy: "No",
          New: "Yes",
          Special: "No",
          Popular: "No",
          "Chef's Pick": "No",
        },
        {
          Category: "Main Course",
          Subcategory: "Grilled",
          Name: "Another Example",
          Description: "Another example to show the format",
          Price: "24.99",
          Calories: 600,
          Allergens: "",
          Vegetarian: "Yes",
          Vegan: "No",
          Spicy: "Yes",
          New: "No",
          Special: "Yes",
          Popular: "Yes",
          "Chef's Pick": "Yes",
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Import Template");
      XLSX.writeFile(workbook, "menu_import_template.xlsx");
      toast.success("Example import template downloaded");
    } catch (error) {
      toast.error("Failed to generate template");
    }
  };

  const handleImportClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            onImportData?.(jsonData);
            onOpenChange(false);
          } catch (error) {
            toast.error("Failed to read file");
          }
        };
        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
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
                  <Label htmlFor="force-decimals" className="text-base">
                    Force 2 Decimal Places
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Always show prices with 2 decimals (e.g., $13.00 instead of $13)
                  </p>
                </div>
                <Switch
                  id="force-decimals"
                  checked={restaurant.force_two_decimals === true}
                  onCheckedChange={(checked) => updateSetting("force_two_decimals", checked)}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-currency" className="text-base">
                    Show Currency Symbol
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display $ sign before prices
                  </p>
                </div>
                <Switch
                  id="show-currency"
                  checked={restaurant.show_currency_symbol !== false}
                  onCheckedChange={(checked) => updateSetting("show_currency_symbol", checked)}
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
                  <Label htmlFor="show-allergens" className="text-base">
                    Show Allergens on Cards
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display allergen badges on dish images (always visible when clicking a dish)
                  </p>
                </div>
                <Switch
                  id="show-allergens"
                  checked={restaurant.show_allergens_on_cards !== false}
                  onCheckedChange={(checked) => updateSetting("show_allergens_on_cards", checked)}
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

          {/* Menu Customization */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Menu Customization</h3>
            <div className="space-y-5">
              {/* Image Shape */}
              <div>
                <Label className="text-base mb-2 block">Image Shape</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Choose the aspect ratio for dish images
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={restaurant.card_image_shape === 'square' ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting("card_image_shape", "square")}
                    disabled={isUpdating}
                    className="flex-1 gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Square
                  </Button>
                  <Button
                    variant={restaurant.card_image_shape !== 'square' ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting("card_image_shape", "vertical")}
                    disabled={isUpdating}
                    className="flex-1 gap-2"
                  >
                    <RectangleVertical className="h-4 w-4" />
                    Vertical
                  </Button>
                </div>
              </div>

              {/* Text Overlay - COMMENTED OUT: Feature disabled
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="text-overlay" className="text-base">
                    Text Overlay
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display dish name overlaid on the image
                  </p>
                </div>
                <Switch
                  id="text-overlay"
                  checked={restaurant.text_overlay === true}
                  onCheckedChange={(checked) => updateSetting("text_overlay", checked)}
                  disabled={isUpdating}
                />
              </div>
              */}


              {/* Menu Font - COMMENTED OUT: Font preview not rendering correctly
              <div>
                <Label className="text-base mb-2 block">Menu Font</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Choose a font for all menu text
                </p>
                <Select
                  value={restaurant.menu_font || 'Inter'}
                  onValueChange={(value) => updateSetting("menu_font", value)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuFontOptions.map((font) => (
                      <SelectItem 
                        key={font.value} 
                        value={font.value}
                        className={font.previewClass}
                      >
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Preview: <span className={`${getFontClassName(restaurant.menu_font || 'Inter')} font-bold`}>Bold Title</span> / <span className={getFontClassName(restaurant.menu_font || 'Inter')}>Description text</span>
                </p>
              </div>
              */}
            </div>
          </div>

          <Separator />

          {/* Layout Options - COMMENTED OUT PER USER REQUEST
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
          */}

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

          <Separator />

          {/* Import / Export */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Import Menu</h3>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleImportClick} className="gap-2 flex-1">
                  <Upload className="h-4 w-4" />
                  Import Excel
                </Button>
                <Button variant="outline" size="sm" onClick={handleExampleImport} className="gap-2 flex-1">
                  <Download className="h-4 w-4" />
                  Example Format
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Download the example template to see the expected format, then import your menu data.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
