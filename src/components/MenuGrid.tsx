import { useState, memo, useCallback } from "react";
import DishCard, { Dish } from "./DishCard";
import { DishDetailDialog, DishDetail } from "./DishDetailDialog";

interface MenuGridProps {
  dishes: Dish[];
  sectionTitle: string;
  gridColumns?: 1 | 2 | 3;
  layoutDensity?: 'compact' | 'spacious';
  fontSize?: 'small' | 'medium' | 'large';
  showPrice?: boolean;
  showImage?: boolean;
  imageSize?: 'compact' | 'large';
  badgeColors?: {
    new_addition: string;
    special: string;
    popular: string;
    chef_recommendation: string;
  };
}

const MenuGrid = memo(({ 
  dishes, 
  sectionTitle,
  gridColumns = 2,
  layoutDensity = 'compact',
  fontSize = 'medium',
  showPrice = true,
  showImage = true,
  imageSize = 'compact',
  badgeColors
}: MenuGridProps) => {
  const [selectedDish, setSelectedDish] = useState<DishDetail | null>(null);

  // Memoize callback to prevent re-renders
  const handleDishClick = useCallback((dish: Dish) => {
    setSelectedDish({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      image: dish.image,
      allergens: dish.allergens,
      calories: dish.calories,
      isVegetarian: dish.isVegetarian,
      isVegan: dish.isVegan,
      isSpicy: dish.isSpicy,
    });
  }, []);

  if (dishes.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-muted-foreground">No dishes available in this category.</p>
      </div>
    );
  }

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3'
  }[gridColumns];

  const gapClass = layoutDensity === 'spacious' ? 'gap-6 md:gap-8' : 'gap-4';
  const paddingClass = layoutDensity === 'spacious' ? 'px-6 py-10' : 'px-6 py-8';

  const titleSizeClass = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-4xl'
  }[fontSize];

  return (
    <>
      <div className={paddingClass} style={{ contentVisibility: 'auto' }}>
        <h2 className={`${titleSizeClass} font-bold text-foreground mb-6`}>{sectionTitle}</h2>
        <div className={`grid ${gridColsClass} ${gapClass}`}>
          {dishes.map((dish) => (
            <DishCard 
              key={dish.id} 
              dish={dish} 
              onClick={() => handleDishClick(dish)}
              showPrice={showPrice}
              showImage={showImage}
              imageSize={imageSize}
              fontSize={fontSize}
              badgeColors={badgeColors}
            />
          ))}
        </div>
      </div>

      <DishDetailDialog
        dish={selectedDish}
        open={!!selectedDish}
        onOpenChange={(open) => !open && setSelectedDish(null)}
      />
    </>
  );
});

MenuGrid.displayName = 'MenuGrid';

export default MenuGrid;
