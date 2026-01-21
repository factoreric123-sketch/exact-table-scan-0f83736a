import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import CategoryNav from "@/components/CategoryNav";
import SubcategoryNav from "@/components/SubcategoryNav";
import MenuGrid from "@/components/MenuGrid";
import RestaurantHeader from "@/components/RestaurantHeader";
import { menuData, categories, subcategories } from "@/data/menuData";
import Footer from "@/components/home/Footer";
import { AllergenFilter, ALLERGEN_OPTIONS, DIETARY_OPTIONS, BADGE_OPTIONS } from "@/components/AllergenFilter";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("Dinner");
  const [activeSubcategory, setActiveSubcategory] = useState("SIDES");
  const subcategoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Filter state
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedSpicy, setSelectedSpicy] = useState<boolean | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

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

  // Scroll to subcategory when clicked with offset for sticky header
  const handleSubcategoryClick = (subcategory: string) => {
    setActiveSubcategory(subcategory);
    const element = subcategoryRefs.current[subcategory];
    if (element) {
      const headerOffset = 120; // Height of sticky navigation (adjust as needed)
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Update active subcategory based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for sticky header
      
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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentSubcategories]);

  // Reset to first subcategory when category changes
  useEffect(() => {
    const newSubcategories = subcategories[activeCategory as keyof typeof subcategories] || [];
    if (newSubcategories.length > 0) {
      setActiveSubcategory(newSubcategories[0]);
    }
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-background">
      {/* Restaurant Hero */}
      <RestaurantHeader 
        name="Victory Restaurant and Lounge"
        tagline="Upscale Dining & Premium Cocktails"
        heroImageUrl={null}
      />

      {/* Category & Subcategory Navigation */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <CategoryNav 
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <div className="flex items-center justify-between px-4 py-2">
          {currentSubcategories.length > 0 && (
            <div className="flex-1">
              <SubcategoryNav
                subcategories={currentSubcategories}
                activeSubcategory={activeSubcategory}
                onSubcategoryChange={handleSubcategoryClick}
              />
            </div>
          )}
          
          {/* Filter Button */}
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={`ml-2 gap-2 shrink-0 ${hasActiveFilters ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 bg-primary-foreground text-primary rounded-full px-1.5 py-0.5 text-xs font-medium">
                    {selectedAllergens.length + selectedDietary.length + (selectedSpicy !== null ? 1 : 0) + selectedBadges.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[400px]">
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
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content - All Subcategories in One Page */}
      <main>
        {currentSubcategories.map((subcategory) => {
          const subcategoryDishes = filteredMenuData.filter(
            (dish) => dish.category === activeCategory && dish.subcategory === subcategory
          );
          
          // Skip empty subcategories after filtering
          if (subcategoryDishes.length === 0) return null;
          
          return (
            <div 
              key={subcategory}
              ref={(el) => subcategoryRefs.current[subcategory] = el}
            >
              <MenuGrid 
                dishes={subcategoryDishes} 
                sectionTitle={subcategory} 
                cardImageShape="vertical"
                useStaticOptions={true}
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

      {/* Footer */}
      <Footer/>
     
    </div>
  );
};

export default Index;
