import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Bookmark, Share2, Menu as MenuIcon, Crown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import CategoryNav from "@/components/CategoryNav";
import SubcategoryNav from "@/components/SubcategoryNav";
import MenuGrid from "@/components/MenuGrid";
import RestaurantHeader from "@/components/RestaurantHeader";
import { AllergenFilter } from "@/components/AllergenFilter";
import { useRestaurant } from "@/hooks/useRestaurants";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { useDishes } from "@/hooks/useDishes";
import { useThemePreview } from "@/hooks/useThemePreview";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

const PublicMenu = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: restaurant, isLoading: restaurantLoading } = useRestaurant(slug || "");
  const { data: categories } = useCategories(restaurant?.id || "");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedSpicy, setSelectedSpicy] = useState<boolean | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const subcategoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Apply restaurant theme to public menu
  useThemePreview(restaurant?.theme as any, !!restaurant);

  const activeCategoryObj = categories?.find((c) => c.id === activeCategory);
  const { data: subcategories } = useSubcategories(activeCategoryObj?.id || "");

  // Set initial active category and subcategory
  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (subcategories && subcategories.length > 0 && !activeSubcategory) {
      setActiveSubcategory(subcategories[0].id);
    }
  }, [subcategories]);

  // Scroll to subcategory when clicked with offset for sticky header
  const handleSubcategoryClick = useCallback((subcategoryId: string) => {
    setActiveSubcategory(subcategoryId);
    const subcategoryName = subcategories?.find(s => s.id === subcategoryId)?.name;
    if (subcategoryName) {
      const element = subcategoryRefs.current[subcategoryName];
      if (element) {
        const headerOffset = 120; // Height of sticky navigation
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [subcategories]);

  // Update active subcategory based on scroll position
  useEffect(() => {
    if (!subcategories || subcategories.length === 0) return;

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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [subcategories]);

  // No loading spinner - show skeleton instead
  if (restaurantLoading || !restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 bg-muted/30 animate-skeleton-pulse border-b border-border" />
        <div className="h-64 md:h-80 bg-muted/50 animate-skeleton-pulse" />
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-3 overflow-x-auto pb-3 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 bg-muted rounded-full animate-skeleton-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-square bg-muted rounded-2xl animate-skeleton-pulse" />
                <div className="h-4 bg-muted rounded animate-skeleton-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-skeleton-pulse w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Check if restaurant owner has premium subscription
  const { data: ownerHasPremium, isLoading: premiumLoading } = useQuery({
    queryKey: ['owner-premium', restaurant?.owner_id],
    queryFn: async () => {
      if (!restaurant?.owner_id) return false;
      
      const { data, error } = await supabase
        .rpc('has_premium_subscription', { user_id_param: restaurant.owner_id });

      if (error) {
        logger.error('Error checking premium status:', error);
        return false;
      }

      return data;
    },
    enabled: !!restaurant?.owner_id,
    staleTime: 1000 * 60 * 10, // 10 minutes - cache premium status longer
  });

  if (!restaurant || !restaurant.published) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Restaurant Not Found</h1>
          <p className="text-muted-foreground">This menu is not available.</p>
        </div>
      </div>
    );
  }

  // Show upgrade prompt if owner doesn't have premium
  if (!premiumLoading && !ownerHasPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Premium Required</h1>
          <p className="text-lg text-muted-foreground">
            This menu requires a premium subscription to be publicly accessible.
          </p>
          <div className="bg-muted/50 rounded-lg p-6 space-y-2">
            <p className="text-sm font-medium">Restaurant owner needs to:</p>
            <p className="text-sm text-muted-foreground">
              Upgrade to TAPTAB Premium ($10/month) to publish this menu and generate QR codes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const categoryNames = categories?.map((c) => c.name) || [];
  const activeCategoryName = categories?.find((c) => c.id === activeCategory)?.name || "";

  // Get all dishes for all subcategories in the active category
  const { data: allDishesForCategory } = useQuery({
    queryKey: ['all-dishes-for-category', activeCategoryObj?.id],
    queryFn: async () => {
      if (!activeCategoryObj?.id) return [];
      
      const { data, error } = await supabase
        .from('dishes')
        .select('*, subcategories!inner(id, name, category_id)')
        .eq('subcategories.category_id', activeCategoryObj.id)
        .order('order_index');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeCategoryObj?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes for public menu
  });

  // Group dishes by subcategory
  const dishesBySubcategory = useMemo(() => {
    if (!allDishesForCategory || !subcategories) return {};
    
    const grouped: Record<string, any[]> = {};
    
    subcategories.forEach(sub => {
      grouped[sub.name] = allDishesForCategory.filter(
        dish => (dish as any).subcategories.id === sub.id
      );
    });
    
    return grouped;
  }, [allDishesForCategory, subcategories]);

  // Filter dishes based on selected allergens and dietary preferences
  const getFilteredDishes = useCallback((dishes: any[]) => {
    if (!dishes || dishes.length === 0) return [];

    // Fast path: No filters applied
    if (selectedAllergens.length === 0 && selectedDietary.length === 0 && selectedSpicy === null && selectedBadges.length === 0) {
      return dishes;
    }

    // Apply filters
    const isVeganSelected = selectedDietary.includes("vegan");
    const isVegetarianSelected = selectedDietary.includes("vegetarian");
    
    return dishes.filter((dish) => {
      // Filter allergens
      if (selectedAllergens.length > 0 && dish.allergens && dish.allergens.length > 0) {
        if (dish.allergens.some((allergen: string) => selectedAllergens.includes(allergen.toLowerCase()))) {
          return false;
        }
      }
      
      // Filter dietary
      if (selectedDietary.length > 0) {
        if (isVeganSelected && !dish.is_vegan) return false;
        if (isVegetarianSelected && !isVeganSelected && !dish.is_vegetarian && !dish.is_vegan) return false;
      }
      
      // Filter spicy
      if (selectedSpicy !== null && dish.is_spicy !== selectedSpicy) {
        return false;
      }
      
      // Filter badges (ALL selected badges must match - AND logic)
      if (selectedBadges.length > 0) {
        if (selectedBadges.includes("new") && !dish.is_new) return false;
        if (selectedBadges.includes("special") && !dish.is_special) return false;
        if (selectedBadges.includes("popular") && !dish.is_popular) return false;
        if (selectedBadges.includes("chef") && !dish.is_chef_recommendation) return false;
      }
      
      return true;
    });
  }, [selectedAllergens, selectedDietary, selectedSpicy, selectedBadges]);

  // Memoize handlers to prevent re-renders
  const handleAllergenToggle = useCallback((allergen: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    );
  }, []);

  const handleDietaryToggle = useCallback((dietary: string) => {
    setSelectedDietary((prev) =>
      prev.includes(dietary)
        ? prev.filter((d) => d !== dietary)
        : [...prev, dietary]
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

  return (
    <div className="min-h-screen bg-background">
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
            {restaurant?.show_allergen_filter !== false && (
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 relative"
                  >
                    <Filter className="h-5 w-5" />
                    {(selectedAllergens.length > 0 || selectedDietary.length > 0 || selectedSpicy !== null || selectedBadges.length > 0) && (
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

      {/* Restaurant Hero */}
      <RestaurantHeader 
        name={restaurant.name}
        tagline={restaurant.tagline || ""}
        heroImageUrl={restaurant.hero_image_url}
      />

      {/* Category & Subcategory Navigation */}
      <div className="sticky top-[57px] z-40 bg-background border-b border-border">
        <CategoryNav 
          categories={categoryNames}
          activeCategory={activeCategoryName}
          onCategoryChange={(name) => {
            const cat = categories?.find((c) => c.name === name);
            if (cat) setActiveCategory(cat.id);
          }}
        />

        {subcategories && subcategories.length > 0 && (
          <SubcategoryNav
            subcategories={subcategories.map((s) => s.name)}
            activeSubcategory={subcategories.find(s => s.id === activeSubcategory)?.name || ""}
            onSubcategoryChange={(name) => {
              const sub = subcategories.find((s) => s.name === name);
              if (sub) handleSubcategoryClick(sub.id);
            }}
          />
        )}
      </div>


      {/* Main Content - All Subcategories in One Page */}
      <main>
        {subcategories?.map((subcategory) => {
          const subcategoryDishes = dishesBySubcategory[subcategory.name] || [];
          const filteredSubcategoryDishes = getFilteredDishes(subcategoryDishes);
          
          // Transform dishes to the format expected by MenuGrid
          const transformedDishes = filteredSubcategoryDishes.map((d) => ({
            id: d.id,
            name: d.name,
            description: d.description || "",
            price: d.price,
            image: d.image_url || "",
            isNew: d.is_new,
            isSpecial: d.is_special,
            isPopular: d.is_popular,
            isChefRecommendation: d.is_chef_recommendation,
            category: activeCategoryName,
            subcategory: subcategory.name,
            allergens: d.allergens,
            calories: d.calories,
            isVegetarian: d.is_vegetarian,
            isVegan: d.is_vegan,
            isSpicy: d.is_spicy,
          }));
          
          return (
            <div 
              key={subcategory.id}
              ref={(el) => subcategoryRefs.current[subcategory.name] = el}
            >
              <MenuGrid 
                dishes={transformedDishes}
                sectionTitle={subcategory.name}
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

export default PublicMenu;
