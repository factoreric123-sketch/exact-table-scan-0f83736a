import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  isNew?: boolean;
  category: string;
  subcategory: string;
  allergens?: string[];
  calories?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isSpicy?: boolean;
}

interface DishCardProps {
  dish: Dish;
  onClick?: () => void;
}

const DishCard = ({ dish, onClick }: DishCardProps) => {
  return (
    <div 
      className="group relative cursor-pointer" 
      onClick={onClick}
    >
      {dish.isNew && (
        <Badge className="absolute top-2 right-2 z-10 bg-new-badge text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
          New Addition
        </Badge>
      )}
      
      <div className="bg-dish-card rounded-2xl overflow-hidden aspect-square mb-2.5 relative shadow-md">
        <img 
          src={dish.image} 
          alt={`${dish.name} - ${dish.description}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Overlay badges */}
        {(dish.allergens && dish.allergens.length > 0) && (
          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
            {dish.allergens.slice(0, 3).map((allergen) => (
              <Badge
                key={allergen}
                variant="secondary"
                className="bg-background/90 backdrop-blur-sm text-xs px-2 py-0.5"
              >
                {allergen}
              </Badge>
            ))}
            {dish.allergens.length > 3 && (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs px-2 py-0.5">
                +{dish.allergens.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
      
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-base font-bold text-foreground">{dish.name}</h3>
          {dish.isSpicy && <Flame className="h-4 w-4 text-red-500 flex-shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">{dish.description}</p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{dish.price}</p>
          {dish.calories && (
            <p className="text-xs text-muted-foreground">{dish.calories} cal</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DishCard;
