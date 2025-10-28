import { Badge } from "@/components/ui/badge";

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isNew?: boolean;
  category: string;
  subcategory: string;
}

interface DishCardProps {
  dish: Dish;
}

const DishCard = ({ dish }: DishCardProps) => {
  return (
    <div className="group relative">
      {dish.isNew && (
        <Badge className="absolute top-3 right-3 z-10 bg-new-badge text-accent-foreground px-3 py-1 rounded-full text-xs font-medium">
          New Addition
        </Badge>
      )}
      <div className="bg-dish-card rounded-xl overflow-hidden aspect-square mb-3 relative">
        <img 
          src={dish.image} 
          alt={dish.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="px-1">
        <h3 className="text-lg font-semibold text-foreground mb-1">{dish.name}</h3>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{dish.description}</p>
        <p className="text-base font-medium text-foreground">{dish.price}</p>
      </div>
    </div>
  );
};

export default DishCard;
