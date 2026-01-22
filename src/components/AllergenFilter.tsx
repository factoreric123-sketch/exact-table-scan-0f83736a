import { Badge } from "@/components/ui/badge";
import { X, Wheat, Milk, Egg, Fish, Nut, Sprout, Flame, Salad, Sparkles, Star, TrendingUp, ChefHat, ChevronDown } from "lucide-react";
import { useMemo, memo, useCallback, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const ALLERGEN_OPTIONS = [
  { value: "gluten", label: "Gluten-Free", Icon: Wheat },
  { value: "dairy", label: "Dairy-Free", Icon: Milk },
  { value: "eggs", label: "Egg-Free", Icon: Egg },
  { value: "fish", label: "Fish-Free", Icon: Fish },
  { value: "shellfish", label: "Shellfish-Free", Icon: Fish },
  { value: "nuts", label: "Nut-Free", Icon: Nut },
  { value: "soy", label: "Soy-Free", Icon: Sprout },
] as const;

export const DIETARY_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian", Icon: Salad },
  { value: "vegan", label: "Vegan", Icon: Sprout },
] as const;

export const BADGE_OPTIONS = [
  { value: "new", label: "New Addition", Icon: Sparkles },
  { value: "special", label: "Special", Icon: Star },
  { value: "popular", label: "Popular", Icon: TrendingUp },
  { value: "chef", label: "Chef's Recommendation", Icon: ChefHat },
] as const;

// Capitalize helper
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

interface AllergenFilterProps {
  selectedAllergens: string[];
  selectedDietary: string[];
  selectedSpicy: boolean | null;
  selectedBadges: string[];
  onAllergenToggle: (allergen: string) => void;
  onDietaryToggle: (dietary: string) => void;
  onSpicyToggle: (value: boolean | null) => void;
  onBadgeToggle: (badge: string) => void;
  onClear: () => void;
  allergenOrder?: string[];
  dietaryOrder?: string[];
  badgeOrder?: string[];
}

export const AllergenFilter = memo(({
  selectedAllergens,
  selectedDietary,
  selectedSpicy,
  selectedBadges,
  onAllergenToggle,
  onDietaryToggle,
  onSpicyToggle,
  onBadgeToggle,
  onClear,
  allergenOrder,
  dietaryOrder,
  badgeOrder,
}: AllergenFilterProps) => {
  const hasActiveFilters = useMemo(
    () => selectedAllergens.length > 0 || selectedDietary.length > 0 || selectedSpicy !== null || selectedBadges.length > 0,
    [selectedAllergens.length, selectedDietary.length, selectedSpicy, selectedBadges.length]
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

  const sortedBadges = useMemo(() => {
    if (!badgeOrder || badgeOrder.length === 0) return BADGE_OPTIONS;
    return badgeOrder
      .map(id => BADGE_OPTIONS.find(o => o.value === id))
      .filter((o): o is typeof BADGE_OPTIONS[number] => o !== undefined);
  }, [badgeOrder]);

  const [allergensOpen, setAllergensOpen] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pr-10">
        <h3 className="text-lg font-semibold text-foreground">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors duration-200 rounded-lg px-3 py-1.5 hover:bg-muted/50"
          >
            <X className="h-4 w-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Dietary preferences */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Dietary Options</h4>
        <div className="flex flex-wrap gap-2">
          {sortedDietary.map((option) => {
            const Icon = option.Icon;
            const isSelected = selectedDietary.includes(option.value);
            return (
              <Badge
                key={option.value}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:scale-105 px-3 py-2 gap-1.5 rounded-full",
                  isSelected && "bg-primary hover:bg-primary/90 shadow-sm"
                )}
                onClick={() => onDietaryToggle(option.value)}
              >
                <Icon className="h-3.5 w-3.5" />
                {option.label}
              </Badge>
            );
          })}
          
          {/* Spicy filter - tri-state */}
          <Badge
            variant={selectedSpicy === null ? "outline" : "default"}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:scale-105 px-3 py-2 gap-1.5 rounded-full",
              selectedSpicy === true && "bg-orange-500 hover:bg-orange-500/90 shadow-sm",
              selectedSpicy === false && "bg-blue-500 hover:bg-blue-500/90 shadow-sm"
            )}
            onClick={() => {
              if (selectedSpicy === null) onSpicyToggle(true);
              else if (selectedSpicy === true) onSpicyToggle(false);
              else onSpicyToggle(null);
            }}
          >
            <Flame className="h-3.5 w-3.5" />
            {selectedSpicy === null ? "Spicy" : selectedSpicy ? "Spicy Only" : "Not Spicy"}
          </Badge>
        </div>
      </div>

      {/* Allergen filters - Collapsible */}
      <Collapsible open={allergensOpen} onOpenChange={setAllergensOpen} className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full group">
          <h4 className="text-sm font-medium text-muted-foreground">Allergies</h4>
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            allergensOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          <div className="flex flex-wrap gap-2 pt-1">
            {sortedAllergens.map((option) => {
              const Icon = option.Icon;
              const isSelected = selectedAllergens.includes(option.value);
              return (
                <Badge
                  key={option.value}
                  variant={isSelected ? "destructive" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105 px-3 py-2 gap-1.5 rounded-full"
                  onClick={() => onAllergenToggle(option.value)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </Badge>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Badges & Labels */}
      {sortedBadges.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Badges & Labels</h4>
          <div className="flex flex-wrap gap-2">
            {sortedBadges.map((option) => {
              const Icon = option.Icon;
              const isSelected = selectedBadges.includes(option.value);
              return (
                <Badge
                  key={option.value}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105 px-3 py-2 gap-1.5 rounded-full"
                  onClick={() => onBadgeToggle(option.value)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

AllergenFilter.displayName = 'AllergenFilter';

// Helper for className
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
