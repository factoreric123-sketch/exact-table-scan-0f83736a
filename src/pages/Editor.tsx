import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useThemeHistory } from "@/hooks/useThemeHistory";
import { getDefaultTheme } from "@/lib/presetThemes";
import { Theme } from "@/lib/types/theme";
import { useQueryClient } from "@tanstack/react-query";
import { MenuDataProvider, useMenuData } from "@/contexts/MenuDataContext";
import { UnifiedMenuRenderer } from "@/components/menu/UnifiedMenuRenderer";

// Inner component that uses the context
const EditorContent = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Get data from context - this is now the SINGLE source of truth
  const { data: menuData, isLoading: menuLoading, refetch: refetchMenu } = useMenuData();
  
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("");
  const [previewMode, setPreviewMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedSpicy, setSelectedSpicy] = useState<boolean | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const subcategoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Legacy hooks for edit mode (still needed for some mutations)
  const { data: restaurant, isLoading: restaurantLoading, refetch: refetchRestaurant } = useRestaurantById(restaurantId || "");
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(restaurantId || "");
  const { data: subcategories = [] } = useSubcategories(activeCategory);
  const { data: dishes = [] } = useDishes(activeSubcategory);
  const updateRestaurant = useUpdateRestaurant();

  // Use context data for preview, legacy data for edit
  const effectiveRestaurant = previewMode ? menuData?.restaurant : restaurant;
  const effectiveCategories = previewMode ? (menuData?.categories || []) : categories;

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

  // Keyboard shortcuts for undo/redo
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
    const cats = previewMode ? effectiveCategories : categories;
    if (cats.length > 0 && !activeCategory) {
      setActiveCategory(cats[0].id);
    }
  }, [categories, effectiveCategories, activeCategory, previewMode]);

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

  // Handle category change
  const handleCategoryChange = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    setActiveSubcategory(""); // Reset subcategory when category changes
  }, []);

  // Scroll to subcategory when clicked (preview mode only)
  const handleSubcategoryClick = useCallback((subcategoryId: string) => {
    setActiveSubcategory(subcategoryId);
    if (previewMode) {
      const currentSubcategories = menuData?.categories.find(c => c.id === activeCategory)?.subcategories || [];
      const subcategoryName = currentSubcategories.find(s => s.id === subcategoryId)?.name;
      if (subcategoryName) {
        const element = subcategoryRefs.current[subcategoryName];
        if (element) {
          const headerOffset = 120;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }
    }
  }, [previewMode, menuData, activeCategory]);

  const handlePublishToggle = async () => {
    if (!restaurant) return;
    
    const newPublishedState = !restaurant.published;
    updateRestaurant.mutate({
      id: restaurant.id,
      updates: { published: newPublishedState }
    });
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
    setViewMode(mode);
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

  // Filter dishes helper function for edit mode
  const getFilteredDishes = useCallback((dishesToFilter: any[]) => {
    if (!dishesToFilter || dishesToFilter.length === 0) return dishesToFilter;
    if (selectedAllergens.length === 0 && selectedDietary.length === 0 && selectedSpicy === null && selectedBadges.length === 0) {
      return dishesToFilter;
    }

    return dishesToFilter.filter((dish) => {
      if (selectedAllergens.length > 0 && dish.allergens && dish.allergens.length > 0) {
        if (dish.allergens.some((allergen: string) => selectedAllergens.includes(allergen.toLowerCase()))) {
          return false;
        }
      }
      
      if (selectedDietary.length > 0) {
        const isVeganSelected = selectedDietary.includes("vegan");
        const isVegetarianSelected = selectedDietary.includes("vegetarian");
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
  }, [selectedAllergens, selectedDietary, selectedSpicy, selectedBadges]);

  const filteredDishes = useMemo(() => getFilteredDishes(dishes), [dishes, getFilteredDishes]);

  // Sync view mode with restaurant preference
  useEffect(() => {
    if (restaurant?.editor_view_mode) {
      setViewMode(restaurant.editor_view_mode as 'grid' | 'table');
    }
  }, [restaurant?.editor_view_mode]);

  // Handle Update button
  const handleUpdate = async () => {
    if (!restaurantId) return;
    await Promise.all([refetchRestaurant(), refetchMenu()]);
    toast("Menu Updated", { description: "All changes are now live!" });
  };

  // Show skeleton only on initial load
  const isInitialLoading = restaurantLoading || (categoriesLoading && categories.length === 0);

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
        onUpdate={handleUpdate}
      />

      <RestaurantHeader
        name={effectiveRestaurant?.name || restaurant.name}
        tagline={effectiveRestaurant?.tagline || restaurant.tagline || ""}
        heroImageUrl={effectiveRestaurant?.hero_image_url || restaurant.hero_image_url}
        editable={!previewMode}
        restaurantId={restaurant.id}
      />

      <div className="mx-auto max-w-6xl">
        {/* PREVIEW MODE: Use UnifiedMenuRenderer for instant sync */}
        {previewMode && (
          <UnifiedMenuRenderer
            mode="preview"
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            subcategoryRefs={subcategoryRefs}
          />
        )}

        {/* EDIT MODE: Use legacy components */}
        {!previewMode && (
          <Sheet>
            <EditableCategories
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              restaurantId={restaurant.id}
              previewMode={previewMode}
              filterSheetTrigger={null}
            />
            
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader className="mb-6" />
              {restaurant.show_allergen_filter !== false && (
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

            <EditableSubcategories
              subcategories={subcategories}
              activeSubcategory={activeSubcategory}
              onSubcategoryChange={handleSubcategoryClick}
              categoryId={activeCategory}
              previewMode={previewMode}
            />

            {activeSubcategory && viewMode === 'grid' && (
              <EditableDishes
                dishes={filteredDishes || dishes}
                subcategoryId={activeSubcategory}
                previewMode={previewMode}
              />
            )}

            {activeSubcategory && viewMode === 'table' && (
              <SpreadsheetView
                dishes={dishes}
                categories={categories}
                subcategories={subcategories}
                restaurantId={restaurant.id}
                activeSubcategoryId={activeSubcategory}
              />
            )}
          </Sheet>
        )}
      </div>
    </div>
  );
};

// Wrapper component that provides the context
const Editor = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  
  if (!restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Restaurant ID required</h1>
        </div>
      </div>
    );
  }

  return (
    <MenuDataProvider restaurantId={restaurantId}>
      <EditorContent />
    </MenuDataProvider>
  );
};

export default Editor;
