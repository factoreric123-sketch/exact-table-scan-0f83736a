import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { Bookmark, Share2, Menu as MenuIcon, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import CategoryNav from '@/components/CategoryNav';
import SubcategoryNav from '@/components/SubcategoryNav';
import MenuGrid from '@/components/MenuGrid';
import RestaurantHeader from '@/components/RestaurantHeader';

// Lazy load filter - not needed for first paint
const AllergenFilter = lazy(() => 
  import('@/components/AllergenFilter').then(m => ({ default: m.AllergenFilter }))
);

interface PublicMenuStaticProps {
  restaurant: any;
  categories: any[];
  onCategoryChange?: (categoryId: string) => void;
}

interface Dish {
  id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  is_new: boolean;
  is_special: boolean;
  is_popular: boolean;
  is_chef_recommendation: boolean;
  allergens: string[];
  calories: number | null;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_spicy: boolean;
  subcategory_id: string;
  order_index: number;
  has_options?: boolean;
  options?: Array<{ id: string; name: string; price: string; order_index: number }>;
  modifiers?: Array<{ id: string; name: string; price: string; order_index: number }>;
}

/**
 * Zero-delay menu renderer
 * Paints shell instantly, hydrates progressively
 */
const PublicMenuStatic = ({ restaurant, categories, onCategoryChange }: PublicMenuStaticProps) => {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedSpicy, setSelectedSpicy] = useState<boolean | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filtersReady, setFiltersReady] = useState(false);
  const subcategoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Set initial category instantly
  useEffect(() => {
    if (categories?.length > 0 && !activeCategory) {
      const firstCategory = categories[0];
      setActiveCategory(firstCategory.id);
      onCategoryChange?.(firstCategory.id);
    }
  }, [categories, activeCategory, onCategoryChange]);

  // Get active category data
  const activeCategoryObj = useMemo(
    () => categories?.find((c) => c.id === activeCategory),
    [categories, activeCategory]
  );

  const subcategories = useMemo(
    () => activeCategoryObj?.subcategories || [],
    [activeCategoryObj]
  );

  // Set initial subcategory instantly
  useEffect(() => {
    if (subcategories?.length > 0 && !activeSubcategory) {
      setActiveSubcategory(subcategories[0].id);
    }
  }, [subcategories, activeSubcategory]);

  // Memoize all dishes for current category
  const allDishes = useMemo(() => {
    if (!subcategories?.length) return [];
    
    const dishes: Dish[] = [];
    subcategories.forEach((subcategory: any) => {
      if (subcategory.dishes) {
        subcategory.dishes.forEach((dish: any) => {
          dishes.push(dish);
        });
      }
    });
    return dishes;
  }, [subcategories]);

  // Group dishes by subcategory
  const dishesBySubcategory = useMemo(() => {
    if (!subcategories?.length || !allDishes.length) return {};

    const grouped: Record<string, Dish[]> = {};
    subcategories.forEach((subcategory: any) => {
      grouped[subcategory.name] = allDishes.filter(
        (dish) => dish.subcategory_id === subcategory.id
      );
    });

    return grouped;
  }, [allDishes, subcategories]);

  // Filter dishes based on selections
  const getFilteredDishes = useCallback(
    (dishesToFilter: Dish[]) => {
      if (
        selectedAllergens.length === 0 &&
        selectedDietary.length === 0 &&
        selectedSpicy === null &&
        selectedBadges.length === 0
      ) {
        return dishesToFilter;
      }

      return dishesToFilter.filter((dish) => {
        if (selectedAllergens.length > 0 && dish.allergens?.length > 0) {
          const hasSelectedAllergen = dish.allergens.some((allergen) =>
            selectedAllergens.includes(allergen.toLowerCase())
          );
          if (hasSelectedAllergen) return false;
        }

        if (selectedDietary.length > 0) {
          const isVeganSelected = selectedDietary.includes('vegan');
          const isVegetarianSelected = selectedDietary.includes('vegetarian');

          if (isVeganSelected && !dish.is_vegan) return false;
          if (isVegetarianSelected && !isVeganSelected && !dish.is_vegetarian && !dish.is_vegan)
            return false;
        }

        if (selectedSpicy !== null && dish.is_spicy !== selectedSpicy) {
          return false;
        }

        if (selectedBadges.length > 0) {
          if (selectedBadges.includes('new') && !dish.is_new) return false;
          if (selectedBadges.includes('special') && !dish.is_special) return false;
          if (selectedBadges.includes('popular') && !dish.is_popular) return false;
          if (selectedBadges.includes('chef') && !dish.is_chef_recommendation) return false;
        }

        return true;
      });
    },
    [selectedAllergens, selectedDietary, selectedSpicy, selectedBadges]
  );

  // Subcategory navigation
  const handleSubcategoryClick = useCallback(
    (subcategoryId: string) => {
      setActiveSubcategory(subcategoryId);
      const subcategory = subcategories.find((s: any) => s.id === subcategoryId);

      if (subcategory?.name) {
        const element = subcategoryRefs.current[subcategory.name];
        if (element) {
          const headerOffset = 120;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      }
    },
    [subcategories]
  );

  // Scroll tracking (deferred)
  useEffect(() => {
    if (!subcategories || subcategories.length === 0) return;

    // Defer scroll listener to after paint
    const timeoutId = setTimeout(() => {
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
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [subcategories]);

  // Load filters after idle
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setFiltersReady(true));
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => setFiltersReady(true), 300);
      return () => clearTimeout(id);
    }
  }, []);

  // Filter handlers
  const handleAllergenToggle = useCallback((allergen: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  }, []);

  const handleDietaryToggle = useCallback((dietary: string) => {
    setSelectedDietary((prev) =>
      prev.includes(dietary) ? prev.filter((d) => d !== dietary) : [...prev, dietary]
    );
  }, []);

  const handleSpicyToggle = useCallback((value: boolean | null) => {
    setSelectedSpicy(value);
  }, []);

  const handleBadgeToggle = useCallback((badge: string) => {
    setSelectedBadges((prev) =>
      prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedAllergens([]);
    setSelectedDietary([]);
    setSelectedSpicy(null);
    setSelectedBadges([]);
  }, []);

  const categoryNames = categories?.map((c) => c.name) || [];
  const activeCategoryName = categories?.find((c) => c.id === activeCategory)?.name || '';

  return (
    <div key={restaurant?.updated_at} className="min-h-screen bg-background">
      {/* Top Action Bar */}
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
            {restaurant?.show_allergen_filter !== false && filtersReady && (
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                    <Filter className="h-5 w-5" />
                    {(selectedAllergens.length > 0 ||
                      selectedDietary.length > 0 ||
                      selectedSpicy !== null ||
                      selectedBadges.length > 0) && (
                      <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                  <Suspense fallback={<div className="p-4">Loading filters...</div>}>
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
                  </Suspense>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </header>

      {/* Restaurant Hero */}
      <RestaurantHeader
        name={restaurant?.name || 'Restaurant Menu'}
        tagline={restaurant?.tagline || ''}
        heroImageUrl={restaurant?.hero_image_url}
      />

      {/* Category & Subcategory Navigation */}
      <div className="sticky top-[57px] z-40 bg-background border-b border-border">
        {categoryNames.length > 0 && activeCategoryName && (
          <CategoryNav
            categories={categoryNames}
            activeCategory={activeCategoryName}
            onCategoryChange={(name) => {
              const category = categories?.find((c) => c.name === name);
              if (category) {
                setActiveCategory(category.id);
                onCategoryChange?.(category.id);
              }
            }}
          />
        )}

        {subcategories && subcategories.length > 0 && (
          <SubcategoryNav
            subcategories={subcategories.map((s: any) => s.name)}
            activeSubcategory={subcategories.find((s: any) => s.id === activeSubcategory)?.name || ''}
            onSubcategoryChange={(name) => {
              const subcategory = subcategories.find((s: any) => s.name === name);
              if (subcategory) handleSubcategoryClick(subcategory.id);
            }}
          />
        )}
      </div>

      {/* Main Content - Progressive Render */}
      <main>
        {subcategories?.map((subcategory: any, index: number) => {
          const subcategoryDishes = dishesBySubcategory[subcategory.name] || [];
          const filteredDishes = getFilteredDishes(subcategoryDishes);

          if (filteredDishes.length === 0) return null;

          const transformedDishes = filteredDishes.map((dish) => ({
            id: dish.id,
            name: dish.name,
            description: dish.description,
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

          // Render first subcategory immediately, defer others
          if (index > 0) {
            return (
              <div
                key={subcategory.id}
                ref={(el) => {
                  subcategoryRefs.current[subcategory.name] = el;
                }}
                style={{ contentVisibility: 'auto' }}
              >
                <MenuGrid 
                  dishes={transformedDishes} 
                  sectionTitle={subcategory.name}
                  gridColumns={restaurant.grid_columns || 2}
                  layoutDensity={restaurant.layout_density || 'compact'}
                  fontSize={restaurant.menu_font_size || 'medium'}
                  showPrice={restaurant.show_prices !== false}
                  showImage={restaurant.show_images !== false}
                  imageSize={restaurant.image_size || 'compact'}
                  badgeColors={restaurant.badge_colors}
                />
              </div>
            );
          }

          return (
            <div
              key={subcategory.id}
              ref={(el) => {
                subcategoryRefs.current[subcategory.name] = el;
              }}
            >
              <MenuGrid 
                dishes={transformedDishes} 
                sectionTitle={subcategory.name}
                gridColumns={restaurant.grid_columns || 2}
                layoutDensity={restaurant.layout_density || 'compact'}
                fontSize={restaurant.menu_font_size || 'medium'}
                showPrice={restaurant.show_prices !== false}
                showImage={restaurant.show_images !== false}
                imageSize={restaurant.image_size || 'compact'}
                badgeColors={restaurant.badge_colors}
              />
            </div>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
          Powered By
          <span className="font-semibold text-foreground">TAPTAB</span>
        </p>
      </footer>
    </div>
  );
};

export default PublicMenuStatic;
