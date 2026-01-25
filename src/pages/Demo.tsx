import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import CategoryNav from "@/components/CategoryNav";
import SubcategoryNav from "@/components/SubcategoryNav";
import MenuGrid from "@/components/MenuGrid";
import RestaurantHeader from "@/components/RestaurantHeader";
import { menuData, categories, subcategories } from "@/data/menuData";
import Footer from "@/components/home/Footer";
import { DishDetailDialog, DishDetail } from "@/components/DishDetailDialog";

// Lazy load filter - not needed for first paint
const AllergenFilter = lazy(() => 
  import('@/components/AllergenFilter').then(m => ({ default: m.AllergenFilter }))
);

const Demo = () => {
  const [activeCategory, setActiveCategory] = useState("Dinner");
  const [activeSubcategory, setActiveSubcategory] = useState("SIDES");
  const subcategoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Filter state
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedSpicy, setSelectedSpicy] = useState<boolean | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filtersReady, setFiltersReady] = useState(false);
  
  // Single dish detail dialog state
  const [selectedDish, setSelectedDish] = useState<DishDetail | null>(null);

  const currentSubcategories = subcategories[activeCategory as keyof typeof subcategories] || [];

  // Filter dishes
  const filteredMenuData = useMemo(() => {
    return menuData.filter((dish) => {
      // Allergen filtering (exclude dishes with selected allergens)
      if (selectedAllergens.length > 0) {
        const dishAllergens = (dish.allergens || []).map(a => a.toLowerCase());
        for (const allergen of selectedAllergens) {
          if (dishAllergens.includes(allergen)) {
            return false;
          }
        }
      }
      
      // Dietary filtering (include dishes that match)
      if (selectedDietary.length > 0) {
        const matchesDietary = selectedDietary.some(diet => {
          if (diet === 'vegetarian') return dish.isVegetarian;
          if (diet === 'vegan') return dish.isVegan;
          return false;
        });
        if (!matchesDietary) return false;
      }
      
      // Spicy filtering
      if (selectedSpicy !== null) {
        if (selectedSpicy && !dish.isSpicy) return false;
        if (!selectedSpicy && dish.isSpicy) return false;
      }
      
      // Badge filtering
      if (selectedBadges.length > 0) {
        const matchesBadge = selectedBadges.some(badge => {
          if (badge === 'new') return dish.isNew;
          if (badge === 'special') return dish.isSpecial;
          if (badge === 'popular') return dish.isPopular;
          if (badge === 'chef') return dish.isChefRecommendation;
          return false;
        });
        if (!matchesBadge) return false;
      }
      
      return true;
    });
  }, [selectedAllergens, selectedDietary, selectedSpicy, selectedBadges]);

  const hasActiveFilters = selectedAllergens.length > 0 || selectedDietary.length > 0 || selectedSpicy !== null || selectedBadges.length > 0;

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

  // Handle dish click from MenuGrid
  const handleDishClick = useCallback((dish: DishDetail) => {
    setSelectedDish(dish);
  }, []);

  // Scroll to subcategory when clicked with offset for sticky header
  const handleSubcategoryClick = useCallback((subcategory: string) => {
    setActiveSubcategory(subcategory);
    const element = subcategoryRefs.current[subcategory];
    if (element) {
      const headerOffset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  // Update active subcategory based on scroll position
  useEffect(() => {
    if (!currentSubcategories.length) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 250;
      
      for (const subcategory of currentSubcategories) {
        const element = subcategoryRefs.current[subcategory];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSubcategory(subcategory);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentSubcategories]);

  // Reset to first subcategory when category changes
  useEffect(() => {
    const newSubcategories = subcategories[activeCategory as keyof typeof subcategories] || [];
    if (newSubcategories.length > 0) {
      setActiveSubcategory(newSubcategories[0]);
    }
  }, [activeCategory]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Restaurant Hero */}
      <RestaurantHeader 
        name="Victory Restaurant and Lounge"
        tagline="Upscale Dining & Premium Cocktails"
        heroImageUrl={null}
      />

      {/* Sticky Navigation */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        {/* Category Nav with Filter Button */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CategoryNav 
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>

          {/* Filter Button */}
          {filtersReady && (
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="mr-4 relative rounded-lg border-border shrink-0"
                >
                  <Filter className="h-4 w-4" />
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                      {selectedAllergens.length + selectedDietary.length + selectedBadges.length + (selectedSpicy !== null ? 1 : 0)}
                    </span>
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
                  />
                </Suspense>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Subcategory Nav */}
        {currentSubcategories.length > 0 && (
          <SubcategoryNav
            subcategories={currentSubcategories}
            activeSubcategory={activeSubcategory}
            onSubcategoryChange={handleSubcategoryClick}
          />
        )}
      </div>

      {/* Main Content */}
      <main>
        {currentSubcategories.map((subcategory, index) => {
          const subcategoryDishes = filteredMenuData.filter(
            (dish) => dish.category === activeCategory && dish.subcategory === subcategory
          );
          
          if (subcategoryDishes.length === 0) return null;
          
          return (
            <div 
              key={subcategory}
              ref={(el) => { subcategoryRefs.current[subcategory] = el; }}
              style={index > 0 ? { contentVisibility: 'auto' } : undefined}
            >
              <MenuGrid 
                dishes={subcategoryDishes} 
                sectionTitle={subcategory} 
                cardImageShape="vertical"
                onDishClick={handleDishClick}
              />
            </div>
          );
        })}
        
        {/* Show message if no dishes match filters */}
        {filteredMenuData.filter(d => d.category === activeCategory).length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No dishes match your current filters.</p>
            <Button variant="link" onClick={handleClearFilters} className="mt-2">
              Clear all filters
            </Button>
          </div>
        )}
      </main>

      {/* Single shared dish detail dialog with static options */}
      <DishDetailDialog
        dish={selectedDish}
        open={!!selectedDish}
        onOpenChange={(open) => !open && setSelectedDish(null)}
        cardImageShape="vertical"
        useStaticOptions={true}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Demo;
