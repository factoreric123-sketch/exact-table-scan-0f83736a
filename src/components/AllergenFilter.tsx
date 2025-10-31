import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export const ALLERGEN_OPTIONS = [
  { value: "gluten", label: "Gluten", icon: "🌾" },
  { value: "dairy", label: "Dairy", icon: "🥛" },
  { value: "eggs", label: "Eggs", icon: "🥚" },
  { value: "fish", label: "Fish", icon: "🐟" },
  { value: "shellfish", label: "Shellfish", icon: "🦐" },
  { value: "nuts", label: "Nuts", icon: "🥜" },
  { value: "soy", label: "Soy", icon: "🫘" },
  { value: "pork", label: "Pork", icon: "🥓" },
  { value: "beef", label: "Beef", icon: "🥩" },
  { value: "poultry", label: "Poultry", icon: "🍗" },
] as const;

export const DIETARY_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian", icon: "🥬" },
  { value: "vegan", label: "Vegan", icon: "🌱" },
] as const;

interface AllergenFilterProps {
  selectedAllergens: string[];
  selectedDietary: string[];
  onAllergenToggle: (allergen: string) => void;
  onDietaryToggle: (dietary: string) => void;
  onClear: () => void;
}

export const AllergenFilter = ({
  selectedAllergens,
  selectedDietary,
  onAllergenToggle,
  onDietaryToggle,
  onClear,
}: AllergenFilterProps) => {
  const hasActiveFilters = selectedAllergens.length > 0 || selectedDietary.length > 0;

  return (
    <div className="px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Filter by dietary restrictions</h3>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Dietary preferences */}
      <div className="flex flex-wrap gap-2 mb-3">
        {DIETARY_OPTIONS.map((option) => (
          <Badge
            key={option.value}
            variant={selectedDietary.includes(option.value) ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => onDietaryToggle(option.value)}
          >
            <span className="mr-1">{option.icon}</span>
            {option.label}
          </Badge>
        ))}
      </div>

      {/* Allergen filters */}
      <div className="flex flex-wrap gap-2">
        {ALLERGEN_OPTIONS.map((option) => (
          <Badge
            key={option.value}
            variant={selectedAllergens.includes(option.value) ? "destructive" : "outline"}
            className="cursor-pointer transition-colors"
            onClick={() => onAllergenToggle(option.value)}
          >
            <span className="mr-1">{option.icon}</span>
            {option.label}
          </Badge>
        ))}
      </div>

      {hasActiveFilters && (
        <p className="text-xs text-muted-foreground mt-3">
          Hiding dishes with selected allergens and showing only selected dietary options
        </p>
      )}
    </div>
  );
};
