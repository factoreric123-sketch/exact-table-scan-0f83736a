import { Badge } from "@/components/ui/badge";
import { X, Wheat, Milk, Egg, Fish, Shell, Nut, Sprout, Beef, Bird, Leaf, Flame, Salad } from "lucide-react";
import { useMemo, memo, useCallback } from "react";

export const ALLERGEN_OPTIONS = [
  { value: "gluten", label: "Gluten", Icon: Wheat },
  { value: "dairy", label: "Dairy", Icon: Milk },
  { value: "eggs", label: "Eggs", Icon: Egg },
  { value: "fish", label: "Fish", Icon: Fish },
  { value: "shellfish", label: "Shellfish", Icon: Shell },
  { value: "nuts", label: "Nuts", Icon: Nut },
  { value: "soy", label: "Soy", Icon: Sprout },
  { value: "pork", label: "Pork", Icon: Beef },
  { value: "beef", label: "Beef", Icon: Beef },
  { value: "poultry", label: "Poultry", Icon: Bird },
] as const;

export const DIETARY_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian", Icon: Salad },
  { value: "vegan", label: "Vegan", Icon: Sprout },
] as const;

// Capitalize helper
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

interface AllergenFilterProps {
  selectedAllergens: string[];
  selectedDietary: string[];
  onAllergenToggle: (allergen: string) => void;
  onDietaryToggle: (dietary: string) => void;
  onClear: () => void;
  allergenOrder?: string[];
  dietaryOrder?: string[];
}

export const AllergenFilter = memo(({
  selectedAllergens,
  selectedDietary,
  onAllergenToggle,
  onDietaryToggle,
  onClear,
  allergenOrder,
  dietaryOrder,
}: AllergenFilterProps) => {
  const hasActiveFilters = useMemo(
    () => selectedAllergens.length > 0 || selectedDietary.length > 0,
    [selectedAllergens.length, selectedDietary.length]
  );

  // Sort options based on custom order
  const sortedAllergens = useMemo(() => {
    if (!allergenOrder || allergenOrder.length === 0) return ALLERGEN_OPTIONS;
    return allergenOrder
      .map(id => ALLERGEN_OPTIONS.find(o => o.value === id))
      .filter((o): o is typeof ALLERGEN_OPTIONS[number] => o !== undefined);
  }, [allergenOrder]);

  const sortedDietary = useMemo(() => {
    if (!dietaryOrder || dietaryOrder.length === 0) return DIETARY_OPTIONS;
    return dietaryOrder
      .map(id => DIETARY_OPTIONS.find(o => o.value === id))
      .filter((o): o is typeof DIETARY_OPTIONS[number] => o !== undefined);
  }, [dietaryOrder]);

  return (
    <div className="px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Filter by dietary restrictions</h3>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors duration-150"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Dietary preferences */}
      <div className="flex flex-wrap gap-2 mb-3">
        {sortedDietary.map((option) => {
          const Icon = option.Icon;
          const isSelected = selectedDietary.includes(option.value);
          return (
            <Badge
              key={option.value}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer ease-out active:scale-95 hover:shadow-md px-3 py-1.5 gap-1.5",
                isSelected && "bg-ios-green hover:bg-ios-green/90"
              )}
              onClick={() => onDietaryToggle(option.value)}
            >
              {isSelected && <Icon className="h-3.5 w-3.5" />}
              {option.label}
            </Badge>
          );
        })}
      </div>

      {/* Allergen filters */}
      <div className="flex flex-wrap gap-2">
        {sortedAllergens.map((option) => {
          const Icon = option.Icon;
          const isSelected = selectedAllergens.includes(option.value);
          return (
            <Badge
              key={option.value}
              variant={isSelected ? "destructive" : "outline"}
              className="cursor-pointer ease-out active:scale-95 hover:shadow-md px-3 py-1.5 gap-1.5"
              onClick={() => onAllergenToggle(option.value)}
            >
              {isSelected && <Icon className="h-3.5 w-3.5" />}
              {capitalize(option.label)}
            </Badge>
          );
        })}
      </div>

      {hasActiveFilters && (
        <p className="text-xs text-muted-foreground mt-3">
          Hiding dishes with selected allergens and showing only selected dietary options
        </p>
      )}
    </div>
  );
});

AllergenFilter.displayName = 'AllergenFilter';

// Helper for className
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
