import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRestaurantById, useUpdateRestaurant } from "@/hooks/useRestaurants";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { useDishes } from "@/hooks/useDishes";
import { EditorTopBar } from "@/components/editor/EditorTopBar";
import { EditableCategories } from "@/components/editor/EditableCategories";
import { EditableSubcategories } from "@/components/editor/EditableSubcategories";
import { EditableDishes } from "@/components/editor/EditableDishes";
import { SpreadsheetView } from "@/components/editor/SpreadsheetView";
import RestaurantHeader from "@/components/RestaurantHeader";
import { AllergenFilter } from "@/components/AllergenFilter";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useThemeHistory } from "@/hooks/useThemeHistory";
import { getDefaultTheme } from "@/lib/presetThemes";
import { Theme } from "@/lib/types/theme";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Editor = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("");
  const [previewMode, setPreviewMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedSpicy, setSelectedSpicy] = useState<boolean | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const subcategoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { data: restaurant, isLoading: restaurantLoading, refetch: refetchRestaurant } = useRestaurantById(restaurantId || "");
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(restaurantId || "");
  const { data: subcategories = [], isLoading: subcategoriesLoading } = useSubcategories(activeCategory);
  const { data: dishes = [], isLoading: dishesLoading } = useDishes(activeSubcategory);
  const updateRestaurant = useUpdateRestaurant();

  // No more polling needed - React Query cache invalidation handles updates instantly

  // Get current category's subcategories for preview mode
  const currentSubcategories = useMemo(() => 
    subcategories.filter(s => s.category_id === activeCategory),
    [subcategories, activeCategory]
  );

  // Get all dishes for all subcategories in preview mode
  const { data: allDishesForCategory } = useQuery({
    queryKey: ['all-dishes-for-category', activeCategory],
    queryFn: async () => {
      if (!activeCategory) return [];
      
      const { data, error } = await supabase
        .from('dishes')
        .select('*, subcategories!inner(id, name, category_id)')
        .eq('subcategories.category_id', activeCategory)
        .order('order_index');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeCategory,
  });

  // Group dishes by subcategory for preview mode
  const dishesBySubcategory = useMemo(() => {
    if (!previewMode || !allDishesForCategory || !currentSubcategories) return {};
    
    const grouped: Record<string, any[]> = {};
    
    currentSubcategories.forEach(sub => {
      grouped[sub.id] = allDishesForCategory.filter(
        dish => (dish as any).subcategories.id === sub.id
      );
    });
    
    return grouped;
  }, [allDishesForCategory, currentSubcategories, previewMode]);

  // Theme history for undo/redo
  const { canUndo, canRedo, undo, redo, push, reset } = useThemeHistory(
    (restaurant?.theme as Theme) || getDefaultTheme()
  );

  // Reset history when restaurant changes
  useEffect(() => {
    if (restaurant?.theme) {
      reset(restaurant.theme as Theme);
    }
  }, [restaurant?.id]);

  const handleUndo = () => {
    const prevTheme = undo();
    if (prevTheme && restaurant) {
      updateRestaurant.mutate({ id: restaurant.id, updates: { theme: prevTheme } });
    }
  };

  const handleRedo = () => {
    const nextTheme = redo();
    if (nextTheme && restaurant) {
      updateRestaurant.mutate({ id: restaurant.id, updates: { theme: nextTheme } });
    }
  };

  const handleThemeChange = (theme: Theme) => {
    push(theme);
  };

  // Keyboard shortcuts for undo/redo - optimized with proper dependencies
  useEffect(() => {
    if (!restaurant || previewMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        
        if (e.shiftKey) {
          const nextTheme = redo();
          if (nextTheme) {
            updateRestaurant.mutate({ id: restaurant.id, updates: { theme: nextTheme } });
          }
        } else {
          const prevTheme = undo();
          if (prevTheme) {
            updateRestaurant.mutate({ id: restaurant.id, updates: { theme: prevTheme } });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewMode, restaurant?.id, undo, redo]);

  // Set initial active category
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // Set initial active subcategory when category changes
  useEffect(() => {
    if (!activeCategory) return;
    
    const subsForActiveCategory = subcategories.filter(s => s.category_id === activeCategory);
    if (subsForActiveCategory.length > 0 && !activeSubcategory) {
      setActiveSubcategory(subsForActiveCategory[0].id);
    } else if (subsForActiveCategory.length === 0) {
      setActiveSubcategory("");
    }
  }, [subcategories, activeCategory]);

  // Scroll to subcategory when clicked with offset for sticky header (preview mode only)
  const handleSubcategoryClick = useCallback((subcategoryId: string) => {
    setActiveSubcategory(subcategoryId);
    if (previewMode) {
      const subcategoryName = currentSubcategories.find(s => s.id === subcategoryId)?.name;
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
    }
  }, [previewMode, currentSubcategories]);

  // Update active subcategory based on scroll position (preview mode only)
  useEffect(() => {
    if (!previewMode || currentSubcategories.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 250;
      
      for (const subcategory of currentSubcategories) {
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
  }, [previewMode, currentSubcategories]);

  const handlePublishToggle = async () => {
    if (!restaurant) return;
    
    const newPublishedState = !restaurant.published;
    
    // Optimistic UI - update immediately
    updateRestaurant.mutate({
      id: restaurant.id,
      updates: { published: newPublishedState }
    });
    
    // Show success immediately (optimistic)
    toast.success(newPublishedState ? "Menu published!" : "Menu unpublished");
  };

  const handleFilterToggle = () => {
    if (!restaurant) return;
    
    const newState = !restaurant.show_allergen_filter;
    
    updateRestaurant.mutate({
      id: restaurant.id,
      updates: { show_allergen_filter: newState }
    });
    
    toast.success(newState ? "Filter enabled" : "Filter disabled");
  };

  const handleViewModeChange = async (mode: 'grid' | 'table') => {
    // Instant UI update
    setViewMode(mode);
    
    // Save in background
    if (restaurant) {
      updateRestaurant.mutate({
        id: restaurant.id,
        updates: { editor_view_mode: mode }
      });
    }
  };

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

  // Filter dishes helper function
  const getFilteredDishes = useCallback((dishesToFilter: any[]) => {
    if (!previewMode || !dishesToFilter || dishesToFilter.length === 0) return dishesToFilter;

    if (selectedAllergens.length === 0 && selectedDietary.length === 0 && selectedSpicy === null && selectedBadges.length === 0) {
      return dishesToFilter;
    }

    const isVeganSelected = selectedDietary.includes("vegan");
    const isVegetarianSelected = selectedDietary.includes("vegetarian");
    
    return dishesToFilter.filter((dish) => {
      if (selectedAllergens.length > 0 && dish.allergens && dish.allergens.length > 0) {
        if (dish.allergens.some((allergen: string) => selectedAllergens.includes(allergen.toLowerCase()))) {
          return false;
        }
      }
      
      if (selectedDietary.length > 0) {
        if (isVeganSelected && !dish.is_vegan) return false;
        if (isVegetarianSelected && !isVeganSelected && !dish.is_vegetarian && !dish.is_vegan) return false;
      }
      
      if (selectedSpicy !== null && dish.is_spicy !== selectedSpicy) {
        return false;
      }
      
      if (selectedBadges.length > 0) {
        if (selectedBadges.includes("new") && !dish.is_new) return false;
        if (selectedBadges.includes("special") && !dish.is_special) return false;
        if (selectedBadges.includes("popular") && !dish.is_popular) return false;
        if (selectedBadges.includes("chef") && !dish.is_chef_recommendation) return false;
      }
      
      return true;
    });
  }, [previewMode, selectedAllergens, selectedDietary, selectedSpicy, selectedBadges]);

  // Filtered dishes for edit mode
  const filteredDishes = useMemo(() => getFilteredDishes(dishes), [dishes, getFilteredDishes]);

  // Sync view mode with restaurant preference
  useEffect(() => {
    if (restaurant?.editor_view_mode) {
      setViewMode(restaurant.editor_view_mode);
    }
  }, [restaurant?.editor_view_mode]);

  // Show skeleton only on initial load, not during refetch
  const isInitialLoading = 
    restaurantLoading || 
    (categoriesLoading && categories.length === 0);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 bg-muted animate-skeleton-pulse" />
        <div className="h-64 bg-muted animate-skeleton-pulse" />
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-3 py-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 w-24 rounded-full bg-muted animate-skeleton-pulse" />
            ))}
          </div>
          <div className="flex gap-4 py-3 border-b">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-20 bg-muted animate-skeleton-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-square rounded-2xl bg-muted animate-skeleton-pulse" />
                <div className="h-4 w-3/4 bg-muted animate-skeleton-pulse" />
                <div className="h-3 w-1/2 bg-muted animate-skeleton-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Restaurant not found</h1>
          <button onClick={() => navigate("/dashboard")} className="text-primary hover:underline">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const activeCategoryData = categories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <EditorTopBar
          restaurant={restaurant}
          previewMode={previewMode}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onPreviewToggle={() => {
            const newPreviewMode = !previewMode;
            if (newPreviewMode && viewMode === 'table') {
              setViewMode('grid');
            }
            setPreviewMode(newPreviewMode);
          }}
          onPublishToggle={handlePublishToggle}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onThemeChange={handleThemeChange}
          onFilterToggle={handleFilterToggle}
          onRefresh={refetchRestaurant}
        />

      <RestaurantHeader
        name={restaurant.name}
        tagline={restaurant.tagline || ""}
        heroImageUrl={restaurant.hero_image_url}
        editable={!previewMode}
        restaurantId={restaurant.id}
      />

      <div className="container mx-auto max-w-6xl">
        <Sheet>
          <EditableCategories
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            restaurantId={restaurant.id}
            previewMode={previewMode}
            filterSheetTrigger={
              previewMode && restaurant.show_allergen_filter !== false ? (
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
              ) : null
            }
          />
          
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader className="mb-6">
            </SheetHeader>
            {previewMode && restaurant.show_allergen_filter !== false && (
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
            )}
          </SheetContent>
        </Sheet>

        <EditableSubcategories
          subcategories={subcategories}
          activeSubcategory={activeSubcategory}
          onSubcategoryChange={handleSubcategoryClick}
          categoryId={activeCategory}
          previewMode={previewMode}
        />

        {/* Preview Mode: Show all subcategories in one page */}
        {previewMode && viewMode === 'grid' && currentSubcategories.map((subcategory) => {
          const subcategoryDishes = dishesBySubcategory[subcategory.id] || [];
          const filteredSubcategoryDishes = getFilteredDishes(subcategoryDishes);
          
          return (
            <div 
              key={subcategory.id}
              ref={(el) => subcategoryRefs.current[subcategory.name] = el}
            >
              <EditableDishes
                dishes={filteredSubcategoryDishes}
                subcategoryId={subcategory.id}
                previewMode={previewMode}
                restaurant={restaurant}
              />
            </div>
          );
        })}

        {/* Edit Mode: Show only active subcategory */}
        {!previewMode && activeSubcategory && viewMode === 'grid' && (
          <EditableDishes
            dishes={filteredDishes || dishes}
            subcategoryId={activeSubcategory}
            previewMode={previewMode}
          />
        )}

        {activeSubcategory && viewMode === 'table' && !previewMode && (
          <SpreadsheetView
            dishes={dishes}
            categories={categories}
            subcategories={subcategories}
            restaurantId={restaurant.id}
            activeSubcategoryId={activeSubcategory}
          />
        )}
      </div>
    </div>
  );
};

export default Editor;
