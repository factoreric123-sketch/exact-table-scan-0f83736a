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
  forceTwoDecimals?: boolean;
  showCurrencySymbol?: boolean;
  layoutStyle?: 'generic' | 'fancy';
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
  forceTwoDecimals = false,
  showCurrencySymbol = true,
  layoutStyle = 'generic',
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
      hasOptions: dish.hasOptions,
      options: dish.options,
      modifiers: dish.modifiers,
    });
  }, []);

  if (dishes.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-muted-foreground">No dishes available in this category.</p>
      </div>
    );
  }

  // 2 columns on mobile, 4 columns on desktop
  const gridColsClass = 'grid-cols-2 lg:grid-cols-4';

  // Fancy layout uses more spacing
  const isFancy = layoutStyle === 'fancy';
  const gapClass = isFancy ? 'gap-5 md:gap-6' : (layoutDensity === 'spacious' ? 'gap-6 md:gap-8' : 'gap-4');
  const paddingClass = isFancy ? 'px-4 py-8' : (layoutDensity === 'spacious' ? 'px-6 py-10' : 'px-6 py-8');

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
              forceTwoDecimals={forceTwoDecimals}
              showCurrencySymbol={showCurrencySymbol}
              layoutStyle={layoutStyle}
              badgeColors={badgeColors}
            />
          ))}
        </div>
      </div>

      <DishDetailDialog
        dish={selectedDish}
        open={!!selectedDish}
        onOpenChange={(open) => !open && setSelectedDish(null)}
        forceTwoDecimals={forceTwoDecimals}
        showCurrencySymbol={showCurrencySymbol}
      />
    </>
  );
});

MenuGrid.displayName = 'MenuGrid';

export default MenuGrid;
