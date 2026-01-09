import { useState, useEffect } from "react";
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Flame, Wheat, Milk, Egg, Fish, Shell, Nut, Sprout, Beef, Bird, Salad } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useDishOptions } from "@/hooks/useDishOptions";
import { useDishModifiers } from "@/hooks/useDishModifiers";
import { getFontClassName } from "@/lib/fontUtils";

export interface DishDetail {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  allergens?: string[];
  calories?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isSpicy?: boolean;
  hasOptions?: boolean;
  options?: Array<{ id: string; name: string; price: string; order_index: number }>;
  modifiers?: Array<{ id: string; name: string; price: string; order_index: number }>;
}

interface DishDetailDialogProps {
  dish: DishDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forceTwoDecimals?: boolean;
  showCurrencySymbol?: boolean;
  menuFont?: string;
  cardImageShape?: 'square' | 'vertical';
}

const allergenIconMap: Record<string, any> = {
  gluten: Wheat,
  dairy: Milk,
  eggs: Egg,
  fish: Fish,
  shellfish: Shell,
  nuts: Nut,
  soy: Sprout,
  pork: Beef,
  beef: Beef,
  poultry: Bird,
};

export const DishDetailDialog = ({ 
  dish, 
  open, 
  onOpenChange, 
  forceTwoDecimals = false, 
  showCurrencySymbol = true, 
  menuFont = 'Inter',
  cardImageShape = 'square'
}: DishDetailDialogProps) => {
  if (!dish) return null;
  
  const fontClass = getFontClassName(menuFont);
  const isVertical = cardImageShape === 'vertical';

  // CRITICAL FIX: Use dataUpdatedAt to detect if cache has been set (even via setQueryData)
  // This ensures optimistic updates are reflected immediately
  const { data: fetchedOptions, dataUpdatedAt: optionsUpdatedAt } = useDishOptions(dish.id);
  const { data: fetchedModifiers, dataUpdatedAt: modifiersUpdatedAt } = useDishModifiers(dish.id);
  
  // Prioritize cached data if it exists (dataUpdatedAt > 0 means cache has data)
  // When hasOptions is toggled OFF, we set cache to [] (empty) via setQueryData
  // dataUpdatedAt will be > 0, so we use [] instead of falling back to stale dish.options
  const options = optionsUpdatedAt > 0 ? (fetchedOptions || []) : (dish.options || []);
  const modifiers = modifiersUpdatedAt > 0 ? (fetchedModifiers || []) : (dish.modifiers || []);
  
  // CRITICAL FIX: Determine if options should be shown based on ACTUAL data in React Query cache
  // When user disables "Enable Pricing Options" toggle:
  // 1. DishOptionsEditor passes EMPTY arrays to applyOptimisticOptionsUpdate
  // 2. This empties the dish-options React Query cache
  // 3. fetchedOptions becomes empty [], optionsFetched is true
  // 4. options = [] (not falling back to stale dish.options!)
  // 5. showOptionsSection becomes false, hiding the options UI
  const hasAnyOptions = options.length > 0 || modifiers.length > 0;
  const showOptionsSection = hasAnyOptions;
  
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [showOptions, setShowOptions] = useState(true); // Auto-expand options

  // Sync selectedOption when options change
  React.useEffect(() => {
    if (options.length > 0) {
      // Reset selection when options change (e.g., after edit)
      const firstOptionId = options[0].id;
      setSelectedOption(prev => options.some(o => o.id === prev) ? prev : firstOptionId);
    }
  }, [options]);

  const formatPrice = (num: number, prefix: string = "") => {
    const currencySymbol = showCurrencySymbol ? "$" : "";
    if (forceTwoDecimals) {
      return `${prefix}${currencySymbol}${num.toFixed(2)}`;
    }
    return Number.isInteger(num) ? `${prefix}${currencySymbol}${num}` : `${prefix}${currencySymbol}${num.toFixed(2)}`;
  };

  const calculateTotalPrice = () => {
    let total = 0;
    
    // Base price or selected option price
    // FIXED: Use showOptionsSection (data-driven) instead of stale dish.hasOptions prop
    if (showOptionsSection && options.length > 0) {
      const option = options.find(o => o.id === selectedOption);
      if (option) {
        const price = parseFloat(option.price.replace(/[^0-9.]/g, ""));
        if (!isNaN(price)) total += price;
      }
    } else {
      const price = parseFloat(dish.price.replace(/[^0-9.]/g, ""));
      if (!isNaN(price)) total += price;
    }
    
    // Add modifiers
    selectedModifiers.forEach(modId => {
      const modifier = modifiers.find(m => m.id === modId);
      if (modifier) {
        const price = parseFloat(modifier.price.replace(/[^0-9.]/g, ""));
        if (!isNaN(price)) total += price;
      }
    });
    
    return formatPrice(total);
  };

  const handleModifierToggle = (modifierId: string) => {
    setSelectedModifiers(prev =>
      prev.includes(modifierId)
        ? prev.filter(id => id !== modifierId)
        : [...prev, modifierId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
        <DialogContent 
          className={`rounded-xl p-0 gap-0 bg-background overflow-hidden ${fontClass} ${
            isVertical 
              ? 'max-w-sm sm:max-w-md md:max-w-3xl md:flex md:flex-row md:h-[75vh]' 
              : 'max-w-[95vw] sm:max-w-lg md:max-w-4xl md:flex md:flex-row md:h-[70vh]'
          }`}
        >
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10 rounded-full bg-background/80 backdrop-blur-sm transition-all duration-150 active:scale-95"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Image Section - responsive based on shape */}
        <div className={`relative bg-dish-card ${
          isVertical 
            ? 'w-full md:w-1/2 md:flex-shrink-0 md:h-full' 
            : 'w-full md:w-1/2 md:flex-shrink-0 md:h-full'
        }`}>
          <img
            src={dish.image}
            alt={dish.name}
            className={`w-full object-cover ${
              isVertical 
                ? 'h-[65vh] sm:h-[55vh] md:h-full' 
                : 'h-[50vh] sm:h-[45vh] md:h-full'
            }`}
          />
        </div>

        {/* Content Section */}
        <div className={`p-6 space-y-4 ${
          isVertical 
            ? 'md:w-1/2 md:overflow-y-auto' 
            : 'md:w-1/2 md:overflow-y-auto'
        }`}>
          {/* Allergen badges */}
          {dish.allergens && dish.allergens.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dish.allergens.map((allergen) => {
                const Icon = allergenIconMap[allergen.toLowerCase()] || Sprout;
                return (
                  <Badge
                    key={allergen}
                    variant="secondary"
                    className="px-3 py-1 text-sm flex items-center gap-1.5"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Dietary badges */}
          <div className="flex flex-wrap gap-2">
            {dish.isVegan && (
              <Badge variant="outline" className="bg-ios-green/10 text-ios-green border-ios-green/20 flex items-center gap-1.5">
                <Sprout className="h-3.5 w-3.5" />
                Vegan
              </Badge>
            )}
            {dish.isVegetarian && !dish.isVegan && (
              <Badge variant="outline" className="bg-ios-green/10 text-ios-green border-ios-green/20 flex items-center gap-1.5">
                <Salad className="h-3.5 w-3.5" />
                Vegetarian
              </Badge>
            )}
            {dish.isSpicy && (
              <Badge variant="outline" className="bg-ios-red/10 text-ios-red border-ios-red/20 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5" />
                Spicy
              </Badge>
            )}
          </div>

          {/* Dish info */}
          <div className="text-left">
            <h2 className="text-3xl font-semibold text-foreground mb-2 text-left">{dish.name}</h2>
            <p className="text-muted-foreground leading-relaxed text-left">{dish.description}</p>
          </div>

          {/* Price and Options */}
          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-3xl font-semibold text-foreground">{calculateTotalPrice()}</div>
              {dish.calories && (
                <div className="text-sm text-muted-foreground">
                  {dish.calories} calories
                </div>
              )}
            </div>

            {/* FIXED: Use showOptionsSection (data-driven) instead of stale dish.hasOptions */}
            {showOptionsSection && (
              <div className="space-y-4 pt-2">
                {options.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-foreground">Choose Size</Label>
                    <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-2">
                      {options.map((option) => {
                        const priceNum = parseFloat(option.price.replace(/[^0-9.]/g, ""));
                        const formattedPrice = isNaN(priceNum) ? option.price : formatPrice(priceNum);
                        return (
                          <Label 
                            key={option.id} 
                            htmlFor={option.id}
                            className="flex items-center justify-between p-3 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer"
                          >
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value={option.id} id={option.id} className="border-2" />
                              <span className="font-medium text-foreground">
                                {option.name}
                              </span>
                            </div>
                            <span className="text-base font-semibold text-foreground">{formattedPrice}</span>
                          </Label>
                        );
                      })}
                    </RadioGroup>
                  </div>
                )}

                {modifiers.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-foreground">Add Extras</Label>
                    <div className="space-y-2">
                      {modifiers.map((modifier) => {
                        const priceNum = parseFloat(modifier.price.replace(/[^0-9.]/g, ""));
                        const formattedPrice = isNaN(priceNum) ? modifier.price : formatPrice(priceNum, "+");
                        return (
                          <Label 
                            key={modifier.id} 
                            htmlFor={modifier.id}
                            className="flex items-center justify-between p-3 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer"
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={modifier.id}
                                checked={selectedModifiers.includes(modifier.id)}
                                onCheckedChange={() => handleModifierToggle(modifier.id)}
                                className="border-2"
                              />
                              <span className="font-medium text-foreground">
                                {modifier.name}
                              </span>
                            </div>
                            <span className="text-base font-semibold text-muted-foreground">{formattedPrice}</span>
                          </Label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
