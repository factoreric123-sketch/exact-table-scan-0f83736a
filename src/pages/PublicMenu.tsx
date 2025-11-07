import { useState, useEffect, useMemo, useCallback, useRef, Component, ReactNode } from "react";
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

interface PublicMenuProps {
  slugOverride?: string;
}

// Error Boundary specifically for PublicMenu
class PublicMenuErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // CRITICAL LOGGING: This is where we catch React rendering errors
    console.error('═══════════════════════════════════════════════════════');
    console.error('[PublicMenu] ⚠️  ERROR BOUNDARY CAUGHT A RENDERING ERROR!');
    console.error('═══════════════════════════════════════════════════════');
    console.error('[PublicMenu] Error:', error);
    console.error('[PublicMenu] Error message:', error.message);
    console.error('[PublicMenu] Error name:', error.name);
    console.error('[PublicMenu] Error stack:');
    console.error(error.stack);
    console.error('[PublicMenu] Component stack:');
    console.error(errorInfo.componentStack);
    console.error('[PublicMenu] Full errorInfo:', JSON.stringify(errorInfo, null, 2));
    console.error('═══════════════════════════════════════════════════════');
    
    // Try to extract more context
    if (error instanceof TypeError) {
      console.error('[PublicMenu] TypeError detected - likely accessing property of undefined/null');
    }
    if (error instanceof ReferenceError) {
      console.error('[PublicMenu] ReferenceError detected - variable not defined');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Unable to Load Menu</h1>
            <p className="text-muted-foreground text-lg">
              We couldn't load this menu. Please try refreshing the page.
            </p>
            <p className="text-sm text-red-500 mt-2">
              Check browser console for detailed error information.
            </p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const PublicMenuContent = ({ slugOverride }: PublicMenuProps = {}) => {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const slug = slugOverride || urlSlug;
  
  // DEBUG: Log slug resolution
  console.log('[PublicMenu] Slug resolution:', {
    slugOverride,
    urlSlug,
    finalSlug: slug,
    hasSlugOverride: !!slugOverride,
    hasUrlSlug: !!urlSlug
  });
  
  // Step 1: Resolve restaurant first (resolve-first pattern)
  const { data: restaurant, isLoading: restaurantLoading, error: restaurantError, isError } = useRestaurant(slug || "");
  
  // DEBUG: Log restaurant query initialization
  console.log('[PublicMenu] Restaurant query initialized:', {
    slug,
    enabled: !!slug,
    loading: restaurantLoading,
    hasData: !!restaurant,
    hasError: isError
  });
  
  // Step 2: Only fetch categories if restaurant exists and is published
  const { data: categories, error: categoriesError } = useCategories(restaurant?.id || "", {
    enabled: !!restaurant?.id && restaurant?.published === true,
  });
  
  console.log('[PublicMenu] Categories loaded:', {
    count: categories?.length || 0,
    hasError: !!categoriesError,
    enabled: !!restaurant?.id && restaurant?.published === true
  });
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
  
  console.log('[PublicMenu] Active category:', {
    activeCategory,
    activeCategoryObj: activeCategoryObj ? 'FOUND' : 'NOT FOUND',
    categoriesCount: categories?.length || 0
  });
  
  // Step 3: Only fetch subcategories if category exists and restaurant is published
  const { data: subcategories, error: subcategoriesError } = useSubcategories(activeCategoryObj?.id || "", {
    enabled: !!activeCategoryObj?.id && restaurant?.published === true,
  });
  
  console.log('[PublicMenu] Subcategories loaded:', {
    count: subcategories?.length || 0,
    hasError: !!subcategoriesError,
    enabled: !!activeCategoryObj?.id && restaurant?.published === true
  });

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
    try {
      setActiveSubcategory(subcategoryId);
      
      // Check if window exists
      if (typeof window === 'undefined') return;
      
      const subcategoryName = subcategories?.find(s => s.id === subcategoryId)?.name;
      if (subcategoryName) {
        const element = subcategoryRefs.current[subcategoryName];
        if (element && element.getBoundingClientRect) {
          const headerOffset = 120; // Height of sticky navigation
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    } catch (err) {
      console.warn('[PublicMenu] Subcategory click error:', err);
    }
  }, [subcategories]);

  // Update active subcategory based on scroll position
  useEffect(() => {
    if (!subcategories || subcategories.length === 0) return;
    
    // Check if window exists (SSR safety)
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      try {
        const scrollPosition = window.scrollY + 250;
        
        for (const subcategory of subcategories) {
          const element = subcategoryRefs.current[subcategory.name];
          if (element && element.offsetTop !== undefined && element.offsetHeight !== undefined) {
            const { offsetTop, offsetHeight } = element;
            if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
              setActiveSubcategory(subcategory.id);
              break;
            }
          }
        }
      } catch (err) {
        console.warn('[PublicMenu] Scroll handler error:', err);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [subcategories]);

  // Show skeleton while loading
  if (restaurantLoading) {
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

  // DEBUG: Log all restaurant query details
  console.log('[PublicMenu] Restaurant query status:', {
    slug,
    slugOverride,
    isError,
    restaurantError: restaurantError?.message,
    restaurant,
    restaurantLoading
  });

  // Show not found if restaurant doesn't exist (check this FIRST, before error handling)
  if (!restaurant && !restaurantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Restaurant Not Found</h1>
          <p className="text-muted-foreground text-lg">
            This menu doesn't exist or has been removed.
          </p>
          <Button onClick={() => window.location.href = '/'} className="mt-4">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  // If we have an error but also have restaurant data, log it but continue
  // (the error might be from a failed retry or something non-critical)
  if ((isError || restaurantError) && restaurant) {
    console.warn('[PublicMenu] Query has error but restaurant data exists, continuing:', {
      error: restaurantError?.message,
      restaurant: restaurant.slug
    });
  }

  // If we have an error AND no restaurant data, show error
  if ((isError || restaurantError) && !restaurant && !restaurantLoading) {
    console.error('[PublicMenu] Restaurant query FAILED with no data');
    console.error('[PublicMenu] Error details:', {
      isError,
      errorMessage: restaurantError?.message,
      errorCode: (restaurantError as any)?.code,
      errorDetails: (restaurantError as any)?.details,
      errorHint: (restaurantError as any)?.hint,
      fullError: restaurantError
    });
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Unable to Load Menu</h1>
          <p className="text-muted-foreground text-lg">
            Database error. Please try again later.
          </p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // If restaurant doesn't exist at this point, we already handled it above
  if (!restaurant) {
    // This should never be reached, but just in case
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  // Show unpublished message if not published
  if (!restaurant.published) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Menu Not Available</h1>
          <p className="text-muted-foreground text-lg">
            This menu hasn't been published yet.
          </p>
          <Button onClick={() => window.location.href = '/'} className="mt-4">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  // Step 4: Check premium status (non-throwing, only if restaurant exists and is published)
  const { data: ownerHasPremium, isLoading: premiumLoading } = useQuery({
    queryKey: ['owner-premium', restaurant?.owner_id],
    queryFn: async () => {
      if (!restaurant?.owner_id) {
        console.log('[PublicMenu] No owner_id, skipping premium check');
        return false;
      }
      
      try {
        console.log('[PublicMenu] Checking premium status for owner:', restaurant.owner_id);
        const { data, error } = await supabase
          .rpc('has_premium_subscription', { user_id_param: restaurant.owner_id });

        if (error) {
          console.error('[PublicMenu] Premium RPC error:', error);
          // If RPC function doesn't exist, fail gracefully
          if (error.message?.includes('function') || error.code === '42883') {
            console.warn('[PublicMenu] has_premium_subscription RPC not found, defaulting to false');
          }
          logger.error('Error checking premium status:', error);
          return false;
        }

        console.log('[PublicMenu] Premium check result:', data);
        return data;
      } catch (err) {
        console.error('[PublicMenu] Premium check exception:', err);
        logger.error('Premium check failed:', err);
        return false;
      }
    },
    enabled: !!restaurant?.owner_id && restaurant?.published === true,
    staleTime: 1000 * 60 * 10,
    // CRITICAL: Don't let premium check errors crash the component
    retry: false,
    throwOnError: false,
  });


  // DISABLED: Premium gate temporarily disabled to allow all menus to show
  // The premium check should happen at link CREATION time, not VIEW time
  // If a link exists and restaurant is published, the menu should be viewable
  /*
  if (!premiumLoading && !ownerHasPremium) {
    console.log('[PublicMenu] Premium check would block menu, but gate is disabled');
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
  */
  
  // Log premium status but don't block menu
  if (!premiumLoading) {
    console.log('[PublicMenu] Premium status:', ownerHasPremium ? 'PREMIUM' : 'FREE');
    if (!ownerHasPremium) {
      console.warn('[PublicMenu] Owner does not have premium, but allowing menu to show');
    }
  }

  // Log any data fetching errors
  if (categoriesError) {
    console.error('[PublicMenu] Categories error:', categoriesError);
  }
  if (subcategoriesError) {
    console.error('[PublicMenu] Subcategories error:', subcategoriesError);
  }
  if (dishesError) {
    console.error('[PublicMenu] Dishes error:', dishesError);
  }

  const categoryNames = categories?.map((c) => c.name) || [];
  const activeCategoryName = categories?.find((c) => c.id === activeCategory)?.name || "";

  // Step 5: Get all dishes only if category exists and restaurant is published
  const { data: allDishesForCategory, error: dishesError } = useQuery({
    queryKey: ['all-dishes-for-category', activeCategoryObj?.id],
    queryFn: async () => {
      if (!activeCategoryObj?.id) {
        console.log('[PublicMenu] No active category, returning empty dishes');
        return [];
      }
      
      try {
        console.log('[PublicMenu] Fetching dishes for category:', activeCategoryObj.id);
        const { data, error } = await supabase
          .from('dishes')
          .select('*, subcategories!inner(id, name, category_id)')
          .eq('subcategories.category_id', activeCategoryObj.id)
          .order('order_index');
        
        if (error) {
          console.error('[PublicMenu] Dishes query error:', error);
          // Don't throw - return empty array and let error state handle it
          return [];
        }
        
        console.log('[PublicMenu] Fetched dishes:', data?.length || 0);
        return data || [];
      } catch (err) {
        console.error('[PublicMenu] Dishes query exception:', err);
        // Never throw - always return empty array
        return [];
      }
    },
    enabled: !!activeCategoryObj?.id && restaurant?.published === true,
    staleTime: 1000 * 60 * 10,
    // CRITICAL: Don't throw errors
    retry: 3,
    throwOnError: false,
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
        name={restaurant.name || "Restaurant Menu"}
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
          try {
            const subcategoryDishes = dishesBySubcategory[subcategory?.name] || [];
            const filteredSubcategoryDishes = getFilteredDishes(subcategoryDishes);
            
            // Transform dishes to the format expected by MenuGrid
            const transformedDishes = filteredSubcategoryDishes
              .filter(d => d && d.id) // Filter out malformed dishes
              .map((d) => ({
                id: d.id,
                name: d.name || "Unnamed Dish",
                description: d.description || "",
                price: d.price || 0,
                image: d.image_url || "",
                isNew: d.is_new || false,
                isSpecial: d.is_special || false,
                isPopular: d.is_popular || false,
                isChefRecommendation: d.is_chef_recommendation || false,
                category: activeCategoryName || "",
                subcategory: subcategory?.name || "",
                allergens: d.allergens || [],
                calories: d.calories || null,
                isVegetarian: d.is_vegetarian || false,
                isVegan: d.is_vegan || false,
                isSpicy: d.is_spicy || false,
              }));
          
            if (filteredSubcategoryDishes.length === 0) return null;

            return (
              <div 
                key={subcategory?.id || subcategory?.name}
                ref={(el) => { if (subcategory?.name) subcategoryRefs.current[subcategory.name] = el; }}
              >
                <MenuGrid 
                  dishes={transformedDishes}
                  sectionTitle={subcategory?.name || "Menu Items"}
                />
              </div>
            );
          } catch (err) {
            console.error('[PublicMenu] Error rendering subcategory:', subcategory?.name, err);
            return null; // Skip this subcategory if it fails
          }
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

const PublicMenu = (props: PublicMenuProps) => (
  <PublicMenuErrorBoundary>
    <PublicMenuContent {...props} />
  </PublicMenuErrorBoundary>
);

export default PublicMenu;
