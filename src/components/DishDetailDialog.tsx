import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Flame, Wheat, Milk, Egg, Fish, Shell, Nut, Sprout, Beef, Bird, Salad, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useDishOptions } from "@/hooks/useDishOptions";
import { useDishModifiers } from "@/hooks/useDishModifiers";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
}

interface DishDetailDialogProps {
  dish: DishDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export const DishDetailDialog = ({ dish, open, onOpenChange }: DishDetailDialogProps) => {
  if (!dish) return null;

  const { data: options = [] } = useDishOptions(dish.id);
  const { data: modifiers = [] } = useDishModifiers(dish.id);
  const [selectedOption, setSelectedOption] = useState(options[0]?.id || "");
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [showOptions, setShowOptions] = useState(false);

  const calculateTotalPrice = () => {
    let total = 0;
    
    // Base price or selected option price
    if (dish.hasOptions && options.length > 0) {
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
    
    return `$${total.toFixed(2)}`;
  };

  const handleModifierToggle = (modifierId: string) => {
    setSelectedModifiers(prev =>
      prev.includes(modifierId)
        ? prev.filter(id => id !== modifierId)
        : [...prev, modifierId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-background overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10 rounded-full bg-background/80 backdrop-blur-sm transition-all duration-150 active:scale-95"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="relative w-full aspect-square bg-dish-card">
          <img
            src={dish.image}
            alt={dish.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 space-y-4">
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
          <div>
            <h2 className="text-3xl font-semibold text-foreground mb-2">{dish.name}</h2>
            <p className="text-muted-foreground leading-relaxed">{dish.description}</p>
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

            {dish.hasOptions && (options.length > 0 || modifiers.length > 0) && (
              <Collapsible open={showOptions} onOpenChange={setShowOptions}>
                <CollapsibleTrigger asChild>
                  <Button variant="default" className="w-full" size="lg">
                    <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
                    Options
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  {options.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Size / Type</Label>
                      <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-2">
                        {options.map((option) => (
                          <div key={option.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={option.id} id={option.id} />
                              <Label htmlFor={option.id} className="cursor-pointer">{option.name}</Label>
                            </div>
                            <span className="text-sm font-semibold">{option.price}</span>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {modifiers.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Add-ons (Optional)</Label>
                      <div className="space-y-2">
                        {modifiers.map((modifier) => (
                          <div key={modifier.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={modifier.id}
                                checked={selectedModifiers.includes(modifier.id)}
                                onCheckedChange={() => handleModifierToggle(modifier.id)}
                              />
                              <Label htmlFor={modifier.id} className="cursor-pointer">{modifier.name}</Label>
                            </div>
                            <span className="text-sm font-semibold">{modifier.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
