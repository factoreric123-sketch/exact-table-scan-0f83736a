import { Badge } from "@/components/ui/badge";
import { Flame, Sparkles, Star, TrendingUp, ChefHat, Wheat, Milk, Egg, Fish, Shell, Nut, Sprout, Beef, Bird } from "lucide-react";
import React, { memo } from "react";
import { useDishOptions } from "@/hooks/useDishOptions";
import { useDishModifiers } from "@/hooks/useDishModifiers";
import { getFontClassName } from "@/lib/fontUtils";

// Capitalize helper
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// Allergen icon map
const allergenIcons: Record<string, React.ElementType> = {
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

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  isNew?: boolean;
  isSpecial?: boolean;
  isPopular?: boolean;
  isChefRecommendation?: boolean;
  category: string;
  subcategory: string;
  allergens?: string[];
  calories?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isSpicy?: boolean;
  hasOptions?: boolean;
  options?: Array<{ id: string; name: string; price: string; order_index: number }>;
  modifiers?: Array<{ id: string; name: string; price: string; order_index: number }>;
}

interface DishCardProps {
  dish: Dish;
  onClick?: () => void;
  showPrice?: boolean;
  showImage?: boolean;
  showAllergens?: boolean;
  imageSize?: 'compact' | 'large';
  fontSize?: 'small' | 'medium' | 'large';
  forceTwoDecimals?: boolean;
  showCurrencySymbol?: boolean;
  layoutStyle?: 'generic' | 'fancy'; // Keep for backwards compatibility
  badgeColors?: {
    new_addition: string;
    special: string;
    popular: string;
    chef_recommendation: string;
  };
  // New customization options
  cardImageShape?: 'square' | 'vertical';
  textOverlay?: boolean;
  menuFont?: string;
}

const DishCard = memo(({ 
  dish, 
  onClick,
  showPrice = true,
  showImage = true,
  showAllergens = true,
  imageSize = 'compact',
  fontSize = 'medium',
  forceTwoDecimals = false,
  showCurrencySymbol = true,
  layoutStyle = 'generic',
  badgeColors = {
    new_addition: "34, 197, 94",
    special: "249, 115, 22",
    popular: "6, 182, 212",
    chef_recommendation: "59, 130, 246",
  },
  cardImageShape = 'vertical',
  textOverlay = false,
  menuFont = 'Inter',
}: DishCardProps) => {
  // Use React Query cache for fresh options/modifiers data
  // CRITICAL: Use dataUpdatedAt to detect if cache has been set (even via setQueryData)
  const { data: cachedOptions, dataUpdatedAt: optionsUpdatedAt } = useDishOptions(dish.id);
  const { data: cachedModifiers, dataUpdatedAt: modifiersUpdatedAt } = useDishModifiers(dish.id);
  
  // Prioritize cached data if it exists (dataUpdatedAt > 0 means cache has data)
  // This ensures optimistic updates via setQueryData are respected immediately
  const options = optionsUpdatedAt > 0 ? (cachedOptions || []) : (dish.options || []);
  const modifiers = modifiersUpdatedAt > 0 ? (cachedModifiers || []) : (dish.modifiers || []);
  const hasActiveOptions = options.length > 0;

  // Use new customization options (fallback to layoutStyle for backwards compatibility)
  const useTextOverlay = textOverlay || layoutStyle === 'fancy';
  const isVertical = cardImageShape === 'vertical' || layoutStyle === 'fancy';

  // Get font class for the menu font
  const fontClass = getFontClassName(menuFont);

  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const descFontSizeClasses = {
    small: 'text-xs',
    medium: 'text-xs',
    large: 'text-sm'
  };

  const priceFontSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  // Aspect ratio based on image shape
  const aspectClass = isVertical ? 'aspect-[3/4]' : 'aspect-square';

  // Text overlay layout - larger images with overlaid dish name at bottom
  if (useTextOverlay) {
    return (
      <div 
        className={`group relative cursor-pointer ${fontClass}`} 
        onClick={onClick}
      >
        {/* Badge in top right */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
          {dish.isNew && (
            <Badge 
              className="text-white px-2 py-0.5 rounded-full text-[10px] font-medium shadow-md"
              style={{ backgroundColor: `rgb(${badgeColors.new_addition})` }}
            >
              New Addition
            </Badge>
          )}
          {dish.isSpecial && (
            <Badge 
              className="text-white px-2 py-0.5 rounded-full text-[10px] font-medium shadow-md"
              style={{ backgroundColor: `rgb(${badgeColors.special})` }}
            >
              Special
            </Badge>
          )}
          {dish.isPopular && (
            <Badge 
              className="text-white px-2 py-0.5 rounded-full text-[10px] font-medium shadow-md"
              style={{ backgroundColor: `rgb(${badgeColors.popular})` }}
            >
              Popular
            </Badge>
          )}
          {dish.isChefRecommendation && (
            <Badge 
              className="text-white px-2 py-0.5 rounded-full text-[10px] font-medium shadow-md"
              style={{ backgroundColor: `rgb(${badgeColors.chef_recommendation})` }}
            >
              Chef's Pick
            </Badge>
          )}
        </div>
        
        {/* Image card with overlaid title */}
        {showImage && (
          <div className={`bg-muted rounded-2xl overflow-hidden ${aspectClass} mb-3 relative shadow-lg`}>
            <img 
              src={dish.image} 
              alt={`${dish.name} - ${dish.description}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            {/* Dish name overlaid at bottom */}
            <h3 className="absolute bottom-3 left-3 right-3 text-white font-bold text-base md:text-lg drop-shadow-lg">
              {dish.name}
            </h3>
          </div>
        )}
        
        {/* Description and price below card */}
        <div className="px-0.5 space-y-1">
          <p className="text-sm text-muted-foreground line-clamp-2">{dish.description}</p>
          <div className="flex items-center justify-between">
            {showPrice && renderPrice()}
            {dish.isSpicy && <Flame className="h-4 w-4 text-red-500 flex-shrink-0" />}
          </div>
        </div>
      </div>
    );
  }

  // Standard layout - compact cards with separate text area
  return (
    <div 
      className={`group relative cursor-pointer ${fontClass}`} 
      onClick={onClick}
    >
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
        {dish.isNew && (
          <Badge 
            className="text-white px-2 py-0.5 rounded-full text-[10px] font-medium shadow-md"
            style={{ backgroundColor: `rgb(${badgeColors.new_addition})` }}
          >
            New Addition
          </Badge>
        )}
        {dish.isSpecial && (
          <Badge 
            className="text-white px-2 py-0.5 rounded-full text-[10px] font-medium shadow-md"
            style={{ backgroundColor: `rgb(${badgeColors.special})` }}
          >
            Special
          </Badge>
        )}
        {dish.isPopular && (
          <Badge 
            className="text-white px-2 py-0.5 rounded-full text-[10px] font-medium shadow-md"
            style={{ backgroundColor: `rgb(${badgeColors.popular})` }}
          >
            Popular
          </Badge>
        )}
        {dish.isChefRecommendation && (
          <Badge 
            className="text-white px-2 py-0.5 rounded-full text-[10px] font-medium shadow-md"
            style={{ backgroundColor: `rgb(${badgeColors.chef_recommendation})` }}
          >
            Chef's Pick
          </Badge>
        )}
      </div>
      
      {showImage && (
        <div className={`bg-dish-card rounded-2xl overflow-hidden ${aspectClass} mb-2.5 relative shadow-md border border-border`}>
          <img 
            src={dish.image} 
            alt={`${dish.name} - ${dish.description}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          
          {/* Overlay badges - only show if showAllergens is true */}
          {showAllergens && (dish.allergens && dish.allergens.length > 0) && (
            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-nowrap gap-0.5 overflow-hidden">
              {dish.allergens.slice(0, 3).map((allergen) => {
                const Icon = allergenIcons[allergen.toLowerCase()];
                return (
                  <Badge
                    key={allergen}
                    variant="secondary"
                    className="bg-background/90 backdrop-blur-sm text-[10px] px-1.5 py-0 gap-0.5 flex-shrink-0 h-5"
                  >
                    {Icon && <Icon className="h-2.5 w-2.5" />}
                    {capitalize(allergen)}
                  </Badge>
                );
              })}
              {dish.allergens.length > 3 && (
                <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-[10px] px-1.5 py-0 flex-shrink-0 h-5">
                  +{dish.allergens.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      )}
      
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className={`${fontSizeClasses[fontSize]} font-bold text-foreground`}>{dish.name}</h3>
          {dish.isSpicy && <Flame className="h-4 w-4 text-red-500 flex-shrink-0" />}
        </div>
        <p className={`${descFontSizeClasses[fontSize]} text-muted-foreground mb-1.5 line-clamp-2`}>{dish.description}</p>
        <div className="flex items-center justify-between">
          {showPrice && renderPrice()}
          {dish.calories && (
            <p className="text-xs text-muted-foreground">{dish.calories} cal</p>
          )}
        </div>
      </div>
    </div>
  );

  // Price rendering helper
  function renderPrice() {
    const currencyPrefix = showCurrencySymbol ? '$' : '';
    const formatPrice = (num: number) => {
      if (forceTwoDecimals) {
        return `${currencyPrefix}${num.toFixed(2)}`;
      }
      return num % 1 === 0 ? `${currencyPrefix}${num.toFixed(0)}` : `${currencyPrefix}${num.toFixed(2)}`;
    };
    
    if (hasActiveOptions) {
      const prices = options
        .map(opt => {
          const num = parseFloat(opt.price.replace(/[^0-9.]/g, ""));
          return isNaN(num) ? 0 : num;
        })
        .filter(p => p > 0)
        .sort((a, b) => a - b);
      
      if (prices.length > 0) {
        const uniquePrices = Array.from(new Set(prices));
        const priceRange = uniquePrices.map(formatPrice).join(' / ');
        const addOns = modifiers.length > 0 ? ' + Add-ons' : '';
        return (
          <p className={`${priceFontSizeClasses[fontSize]} font-semibold text-foreground`}>
            {priceRange + addOns}
          </p>
        );
      }
    }
    
    if (modifiers.length > 0) {
      const baseNum = parseFloat(dish.price.replace(/[^0-9.]/g, ""));
      if (!isNaN(baseNum) && baseNum > 0) {
        return (
          <p className={`${priceFontSizeClasses[fontSize]} font-semibold text-foreground`}>
            {formatPrice(baseNum)} + Add-ons
          </p>
        );
      }
      return null;
    }
    
    const baseNum = parseFloat(dish.price.replace(/[^0-9.]/g, ""));
    if (isNaN(baseNum) || baseNum === 0) {
      return null;
    }
    return (
      <p className={`${priceFontSizeClasses[fontSize]} font-semibold text-foreground`}>
        {formatPrice(baseNum)}
      </p>
    );
  }
});

DishCard.displayName = 'DishCard';

export default DishCard;
