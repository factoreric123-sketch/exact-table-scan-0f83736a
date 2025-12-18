import { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react';
import { useMenuData, CategoryData, SubcategoryData, DishData } from '@/contexts/MenuDataContext';
import MenuGrid from '@/components/MenuGrid';
import { AllergenFilter } from '@/components/AllergenFilter';
import CategoryNav from '@/components/CategoryNav';
import SubcategoryNav from '@/components/SubcategoryNav';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Filter, Bookmark, Share2, Menu as MenuIcon } from 'lucide-react';

export type MenuMode = 'editor' | 'preview' | 'live';

interface UnifiedMenuRendererProps {
  mode: MenuMode;
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  /** For editor mode: ref to subcategory elements for scroll tracking */
  subcategoryRefs?: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
}

/**
 * Unified Menu Renderer
 * Single component that renders menu data in different modes:
 * - editor: Shows editable version in Editor page
 * - preview: Shows preview in Editor page (read-only)
 * - live: Shows public-facing menu
 */
export const UnifiedMenuRenderer = memo(({
  mode,
  activeCategory,
  onCategoryChange,
  subcategoryRefs: externalRefs
}: UnifiedMenuRendererProps) => {
  const { data } = useMenuData();
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedSpicy, setSelectedSpicy] = useState<boolean | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const internalRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const subcategoryRefs = externalRefs || internalRefs;

  const restaurant = data?.restaurant;
  const categories = data?.categories || [];

  // Get active category data
  const activeCategoryData = useMemo(
    () => categories.find(c => c.id === activeCategory),
    [categories, activeCategory]
  );

  const subcategories = activeCategoryData?.subcategories || [];

  // Set initial subcategory
  useEffect(() => {
    if (subcategories.length > 0 && !activeSubcategory) {
      setActiveSubcategory(subcategories[0].id);
    }
  }, [subcategories, activeSubcategory]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (subcategories.length > 0) {
      setActiveSubcategory(subcategories[0].id);
    } else {
      setActiveSubcategory('');
    }
  }, [activeCategory]);

  // Filter dishes
  const getFilteredDishes = useCallback((dishes: DishData[]) => {
    if (
      selectedAllergens.length === 0 &&
      selectedDietary.length === 0 &&
      selectedSpicy === null &&
      selectedBadges.length === 0
    ) {
      return dishes;
    }

    return dishes.filter(dish => {
      // Allergen filter (exclude if has selected allergen)
      if (selectedAllergens.length > 0 && dish.allergens?.length) {
        if (dish.allergens.some(a => selectedAllergens.includes(a.toLowerCase()))) {
          return false;
        }
      }

      // Dietary filter
      if (selectedDietary.length > 0) {
        if (selectedDietary.includes('vegan') && !dish.is_vegan) return false;
        if (selectedDietary.includes('vegetarian') && !selectedDietary.includes('vegan')) {
          if (!dish.is_vegetarian && !dish.is_vegan) return false;
        }
      }

      // Spicy filter
      if (selectedSpicy !== null && dish.is_spicy !== selectedSpicy) {
        return false;
      }

      // Badge filter
      if (selectedBadges.length > 0) {
        if (selectedBadges.includes('new') && !dish.is_new) return false;
        if (selectedBadges.includes('special') && !dish.is_special) return false;
        if (selectedBadges.includes('popular') && !dish.is_popular) return false;
        if (selectedBadges.includes('chef') && !dish.is_chef_recommendation) return false;
      }

      return true;
    });
  }, [selectedAllergens, selectedDietary, selectedSpicy, selectedBadges]);

  // Subcategory click handler
  const handleSubcategoryClick = useCallback((subcategoryId: string) => {
    setActiveSubcategory(subcategoryId);
    const subcategory = subcategories.find(s => s.id === subcategoryId);
    
    if (subcategory?.name) {
      const element = subcategoryRefs.current[subcategory.name];
      if (element) {
        const headerOffset = 120;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }
  }, [subcategories, subcategoryRefs]);

  // Scroll tracking
  useEffect(() => {
    if (subcategories.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 250;
      
      for (const subcategory of subcategories) {
        const element = subcategoryRefs.current[subcategory.name];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSubcategory(subcategory.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [subcategories, subcategoryRefs]);

  // Filter handlers
  const handleAllergenToggle = useCallback((allergen: string) => {
    setSelectedAllergens(prev =>
      prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
    );
  }, []);

  const handleDietaryToggle = useCallback((dietary: string) => {
    setSelectedDietary(prev =>
      prev.includes(dietary) ? prev.filter(d => d !== dietary) : [...prev, dietary]
    );
  }, []);

  const handleSpicyToggle = useCallback((value: boolean | null) => {
    setSelectedSpicy(value);
  }, []);

  const handleBadgeToggle = useCallback((badge: string) => {
    setSelectedBadges(prev =>
      prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedAllergens([]);
    setSelectedDietary([]);
    setSelectedSpicy(null);
    setSelectedBadges([]);
  }, []);

  if (!restaurant || !data) return null;

  const categoryNames = categories.map(c => c.name);
  const activeCategoryName = activeCategoryData?.name || '';
  const hasFilters = selectedAllergens.length > 0 || selectedDietary.length > 0 || selectedSpicy !== null || selectedBadges.length > 0;

  return (
    <>
      {/* Top action bar for live mode */}
      {mode === 'live' && (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MenuIcon className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Bookmark className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Share2 className="h-5 w-5" />
              </Button>
              {restaurant.show_allergen_filter !== false && (
                <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                      <Filter className="h-5 w-5" />
                      {hasFilters && (
                        <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                    <AllergenFilter
                      selectedAllergens={selectedAllergens}
                      selectedDietary={selectedDietary}
                      selectedSpicy={selectedSpicy}
                      selectedBadges={selectedBadges}
                      onAllergenToggle={handleAllergenToggle}
                      onDietaryToggle={handleDietaryToggle}
                      onSpicyToggle={handleSpicyToggle}
                      onBadgeToggle={handleBadgeToggle}
                      onClear={handleClearFilters}
                      allergenOrder={restaurant.allergen_filter_order as string[] | undefined}
                      dietaryOrder={restaurant.dietary_filter_order as string[] | undefined}
                      badgeOrder={restaurant.badge_display_order as string[] | undefined}
                    />
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Category & Subcategory Navigation */}
      <div className="z-40 bg-background border-b border-border">
        {categoryNames.length > 0 && activeCategoryName && (
          <CategoryNav
            categories={categoryNames}
            activeCategory={activeCategoryName}
            onCategoryChange={(name) => {
              const category = categories.find(c => c.name === name);
              if (category) {
                onCategoryChange(category.id);
              }
            }}
          />
        )}

        {subcategories.length > 0 && (
          <SubcategoryNav
            subcategories={subcategories.map(s => s.name)}
            activeSubcategory={subcategories.find(s => s.id === activeSubcategory)?.name || ''}
            onSubcategoryChange={(name) => {
              const subcategory = subcategories.find(s => s.name === name);
              if (subcategory) handleSubcategoryClick(subcategory.id);
            }}
          />
        )}
      </div>

      {/* Menu Content */}
      <main>
        {subcategories.map((subcategory, index) => {
          const filteredDishes = getFilteredDishes(subcategory.dishes);
          if (filteredDishes.length === 0) return null;

          // Transform dishes for MenuGrid
          const transformedDishes = filteredDishes.map(dish => ({
            id: dish.id,
            name: dish.name,
            description: dish.description || '',
            price: dish.price,
            image: dish.image_url || '/placeholder.svg',
            isNew: dish.is_new,
            isSpecial: dish.is_special,
            isPopular: dish.is_popular,
            isChefRecommendation: dish.is_chef_recommendation,
            category: activeCategoryName,
            subcategory: subcategory.name,
            allergens: dish.allergens || [],
            calories: dish.calories,
            isVegetarian: dish.is_vegetarian,
            isVegan: dish.is_vegan,
            isSpicy: dish.is_spicy,
            hasOptions: dish.has_options || (dish.options?.length ?? 0) > 0,
            options: dish.options || [],
            modifiers: dish.modifiers || [],
          }));

          return (
            <div
              key={subcategory.id}
              ref={(el) => {
                subcategoryRefs.current[subcategory.name] = el;
              }}
              style={index > 0 ? { contentVisibility: 'auto' } : undefined}
            >
              <MenuGrid
                dishes={transformedDishes}
                sectionTitle={subcategory.name}
                gridColumns={(restaurant.grid_columns || 2) as 1 | 2 | 3}
                layoutDensity={(restaurant.layout_density as 'compact' | 'spacious') || 'compact'}
                fontSize={(restaurant.menu_font_size as 'small' | 'medium' | 'large') || 'medium'}
                showPrice={restaurant.show_prices !== false}
                showImage={restaurant.show_images !== false}
                imageSize={(restaurant.image_size as 'compact' | 'large') || 'compact'}
                badgeColors={restaurant.badge_colors}
              />
            </div>
          );
        })}
      </main>

      {/* Footer for live mode */}
      {mode === 'live' && (
        <footer className="py-8 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            Powered By
            <span className="font-semibold text-foreground">TAPTAB</span>
          </p>
        </footer>
      )}
    </>
  );
});

UnifiedMenuRenderer.displayName = 'UnifiedMenuRenderer';
