import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

interface DishDetailDialogProps {
  dish: DishDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const allergenIcons: Record<string, string> = {
  gluten: "🌾",
  dairy: "🥛",
  eggs: "🥚",
  fish: "🐟",
  shellfish: "🦐",
  nuts: "🥜",
  soy: "🫘",
  pork: "🥓",
  beef: "🥩",
  poultry: "🍗",
};

export const DishDetailDialog = ({ dish, open, onOpenChange }: DishDetailDialogProps) => {
  if (!dish) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-background overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10 rounded-full bg-background/80 backdrop-blur-sm"
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
              {dish.allergens.map((allergen) => (
                <Badge
                  key={allergen}
                  variant="secondary"
                  className="px-3 py-1 text-sm"
                >
                  <span className="mr-1">{allergenIcons[allergen.toLowerCase()]}</span>
                  {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                </Badge>
              ))}
            </div>
          )}

          {/* Dietary badges */}
          <div className="flex flex-wrap gap-2">
            {dish.isVegan && (
              <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
                🌱 Vegan
              </Badge>
            )}
            {dish.isVegetarian && !dish.isVegan && (
              <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
                🥬 Vegetarian
              </Badge>
            )}
            {dish.isSpicy && (
              <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700">
                <Flame className="h-3 w-3 mr-1" />
                Spicy
              </Badge>
            )}
          </div>

          {/* Dish info */}
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">{dish.name}</h2>
            <p className="text-muted-foreground leading-relaxed">{dish.description}</p>
          </div>

          {/* Price and calories */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="text-3xl font-bold text-foreground">{dish.price}</div>
            {dish.calories && (
              <div className="text-sm text-muted-foreground">
                {dish.calories} calories
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
