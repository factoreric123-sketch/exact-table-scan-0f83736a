import { memo, useCallback } from "react";
import DishCard, { Dish } from "./DishCard";
import { DishDetail } from "./DishDetailDialog";
import { getFontClassName } from "@/lib/fontUtils";

interface MenuGridProps {
  dishes: Dish[];
  sectionTitle: string;
  gridColumns?: 1 | 2 | 3;
  layoutDensity?: 'compact' | 'spacious';
  fontSize?: 'small' | 'medium' | 'large';
  showPrice?: boolean;
  showImage?: boolean;
  showAllergens?: boolean;
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
  cardImageShape?: 'square' | 'vertical';
  textOverlay?: boolean;
  menuFont?: string;
  // Callback to parent when dish is clicked
  onDishClick?: (dish: DishDetail) => void;
}

const MenuGrid = memo(({ 
  dishes, 
  sectionTitle,
  gridColumns = 2,
  layoutDensity = 'compact',
  fontSize = 'medium',
  showPrice = true,
  showImage = true,
  showAllergens = true,
  imageSize = 'compact',
  forceTwoDecimals = false,
  showCurrencySymbol = true,
  layoutStyle = 'generic',
  badgeColors,
  cardImageShape = 'vertical',
  textOverlay = false,
  menuFont = 'Inter',
  onDishClick,
}: MenuGridProps) => {
  // Memoize callback to prevent re-renders
  const handleDishClick = useCallback((dish: Dish) => {
    if (onDishClick) {
      onDishClick({
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
    }
  }, [onDishClick]);

  if (dishes.length === 0) {
    return null;
  }

  // 2 columns on mobile, 4 columns on desktop
  const gridColsClass = 'grid-cols-2 lg:grid-cols-4';

  // Text overlay uses more spacing
  const useOverlay = textOverlay || layoutStyle === 'fancy';
  const gapClass = useOverlay ? 'gap-5 md:gap-6' : (layoutDensity === 'spacious' ? 'gap-6 md:gap-8' : 'gap-4');
  const paddingClass = useOverlay ? 'px-4 py-8' : (layoutDensity === 'spacious' ? 'px-6 py-10' : 'px-6 py-8');

  const titleSizeClass = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-4xl'
  }[fontSize];

  // Get font class for menu font
  const fontClass = getFontClassName(menuFont);

  return (
    <div className={`${paddingClass} ${fontClass}`} style={{ contentVisibility: 'auto' }}>
      <h2 className={`${titleSizeClass} font-bold text-foreground mb-6`}>{sectionTitle}</h2>
      <div className={`grid ${gridColsClass} ${gapClass}`}>
        {dishes.map((dish) => (
          <DishCard 
            key={dish.id} 
            dish={dish} 
            onClick={() => handleDishClick(dish)}
            showPrice={showPrice}
            showImage={showImage}
            showAllergens={showAllergens}
            imageSize={imageSize}
            fontSize={fontSize}
            forceTwoDecimals={forceTwoDecimals}
            showCurrencySymbol={showCurrencySymbol}
            layoutStyle={layoutStyle}
            badgeColors={badgeColors}
            cardImageShape={cardImageShape}
            textOverlay={textOverlay}
            menuFont={menuFont}
          />
        ))}
      </div>
    </div>
  );
});

MenuGrid.displayName = 'MenuGrid';

export default MenuGrid;
