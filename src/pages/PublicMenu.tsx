import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Bookmark, Share2, Menu as MenuIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import CategoryNav from "@/components/CategoryNav";
import SubcategoryNav from "@/components/SubcategoryNav";
import MenuGrid from "@/components/MenuGrid";
import RestaurantHeader from "@/components/RestaurantHeader";
import { AllergenFilter } from "@/components/AllergenFilter";
import { useRestaurant } from "@/hooks/useRestaurants";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeMenuUpdates } from "@/hooks/useMenuSync";

interface PublicMenuProps {
  slugOverride?: string;
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

const PublicMenu = ({ slugOverride }: PublicMenuProps) => {
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedSpicy, setSelectedSpicy] = useState<boolean | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dishesLoading, setDishesLoading] = useState(false);
  const subcategoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { slug: urlSlug } = useParams<{ slug: string }>();
  const slug = slugOverride || urlSlug;

  // Instant data fetching with aggressive caching
  const { data: restaurant, isLoading: restaurantLoading } = useRestaurant(slug || "");
  
  // Enable realtime updates for instant sync with editor
  useRealtimeMenuUpdates(restaurant?.id);
  
  const { data: categories } = useCategories(restaurant?.id || "", {
    enabled: !!restaurant?.id && restaurant?.published === true,
  });

  const activeCategoryObj = categories?.find((c) => c.id === activeCategory);
  const { data: subcategories } = useSubcategories(activeCategoryObj?.id || "", {
    enabled: !!activeCategoryObj?.id && restaurant?.published === true,
  });

  // Optimized dish fetching - instant with cache
  useEffect(() => {
    const fetchDishes = async () => {
      if (!subcategories?.length) {
        setDishes([]);
        return;
      }

      setDishesLoading(true);
      const subcategoryIds = subcategories.map((sub) => sub.id);

      const { data } = await supabase
        .from("dishes")
        .select("*")
        .in("subcategory_id", subcategoryIds)
        .order("order_index");

      setDishes(data || []);
      setDishesLoading(false);
    };

    fetchDishes();
  }, [subcategories]);

  // Set initial active category
  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // Set initial active subcategory
  useEffect(() => {
    if (subcategories && subcategories.length > 0 && !activeSubcategory) {
      setActiveSubcategory(subcategories[0].id);
    }
  }, [subcategories, activeSubcategory]);

  // Handle subcategory click with scroll
  const handleSubcategoryClick = useCallback(
    (subcategoryId: string) => {
      setActiveSubcategory(subcategoryId);
      const subcategory = subcategories?.find((s) => s.id === subcategoryId);

      if (subcategory?.name) {
        const element = subcategoryRefs.current[subcategory.name];
        if (element) {
          const headerOffset = 120;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }
    },
    [subcategories],
  );

  // Scroll handler for active subcategory with throttle
  useEffect(() => {
    if (!subcategories || subcategories.length === 0) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      
      requestAnimationFrame(() => {
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
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [subcategories]);

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
        // Filter allergens
        if (selectedAllergens.length > 0 && dish.allergens && dish.allergens.length > 0) {
          const hasSelectedAllergen = dish.allergens.some((allergen) =>
            selectedAllergens.includes(allergen.toLowerCase()),
          );
          if (hasSelectedAllergen) return false;
        }

        // Filter dietary
        if (selectedDietary.length > 0) {
          const isVeganSelected = selectedDietary.includes("vegan");
          const isVegetarianSelected = selectedDietary.includes("vegetarian");

          if (isVeganSelected && !dish.is_vegan) return false;
          if (isVegetarianSelected && !isVeganSelected && !dish.is_vegetarian && !dish.is_vegan) return false;
        }

        // Filter spicy
        if (selectedSpicy !== null && dish.is_spicy !== selectedSpicy) {
          return false;
        }

        // Filter badges
        if (selectedBadges.length > 0) {
          if (selectedBadges.includes("new") && !dish.is_new) return false;
          if (selectedBadges.includes("special") && !dish.is_special) return false;
          if (selectedBadges.includes("popular") && !dish.is_popular) return false;
          if (selectedBadges.includes("chef") && !dish.is_chef_recommendation) return false;
        }

        return true;
      });
    },
    [selectedAllergens, selectedDietary, selectedSpicy, selectedBadges],
  );

  // Group dishes by subcategory
  const dishesBySubcategory = useMemo(() => {
    if (!dishes.length || !subcategories) return {};

    const grouped: Record<string, Dish[]> = {};

    subcategories.forEach((subcategory) => {
      grouped[subcategory.name] = dishes.filter((dish) => dish.subcategory_id === subcategory.id);
    });

    return grouped;
  }, [dishes, subcategories]);

  // Filter handlers
  const handleAllergenToggle = useCallback((allergen: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen],
    );
  }, []);

  const handleDietaryToggle = useCallback((dietary: string) => {
    setSelectedDietary((prev) => (prev.includes(dietary) ? prev.filter((d) => d !== dietary) : [...prev, dietary]));
  }, []);

  const handleSpicyToggle = useCallback((value: boolean | null) => {
    setSelectedSpicy(value);
  }, []);

  const handleBadgeToggle = useCallback((badge: string) => {
    setSelectedBadges((prev) => (prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge]));
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedAllergens([]);
    setSelectedDietary([]);
    setSelectedSpicy(null);
    setSelectedBadges([]);
  }, []);

  // Loading state
  if (restaurantLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 bg-muted/30 animate-pulse border-b border-border" />
        <div className="h-64 md:h-80 bg-muted/50 animate-pulse" />
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-3 overflow-x-auto pb-3 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 bg-muted rounded-full animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-square bg-muted rounded-2xl animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Restaurant Not Found</h1>
          <p className="text-muted-foreground text-lg">This menu doesn't exist or has been removed.</p>
          <Button onClick={() => (window.location.href = "/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  if (!restaurant.published) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Menu Not Available</h1>
          <p className="text-muted-foreground text-lg">This menu hasn't been published yet.</p>
          <Button onClick={() => (window.location.href = "/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  const categoryNames = categories?.map((c) => c.name) || [];
  const activeCategoryName = categories?.find((c) => c.id === activeCategory)?.name || "";

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
        {categoryNames.length > 0 && activeCategoryName && (
          <CategoryNav
            categories={categoryNames}
            activeCategory={activeCategoryName}
            onCategoryChange={(name) => {
              const category = categories?.find((c) => c.name === name);
              if (category) setActiveCategory(category.id);
            }}
          />
        )}

        {subcategories && subcategories.length > 0 && (
          <SubcategoryNav
            subcategories={subcategories.map((s) => s.name)}
            activeSubcategory={subcategories.find((s) => s.id === activeSubcategory)?.name || ""}
            onSubcategoryChange={(name) => {
              const subcategory = subcategories.find((s) => s.name === name);
              if (subcategory) handleSubcategoryClick(subcategory.id);
            }}
          />
        )}
      </div>

      {/* Main Content */}
      <main>
        {dishesLoading ? (
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-square bg-muted rounded-2xl animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          subcategories?.map((subcategory) => {
            const subcategoryDishes = dishesBySubcategory[subcategory.name] || [];
            const filteredDishes = getFilteredDishes(subcategoryDishes);

            if (filteredDishes.length === 0) return null;

            const transformedDishes = filteredDishes.map((dish) => ({
              id: dish.id,
              name: dish.name,
              description: dish.description,
              price: dish.price,
              image: dish.image_url || "/placeholder.svg",
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
              >
                <MenuGrid dishes={transformedDishes} sectionTitle={subcategory.name} />
              </div>
            );
          })
        )}
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