import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useThemeHistory } from "@/hooks/useThemeHistory";
import { getDefaultTheme } from "@/lib/presetThemes";
import { Theme } from "@/lib/types/theme";

const Editor = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("");
  const [previewMode, setPreviewMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const { data: restaurant, isLoading: restaurantLoading } = useRestaurantById(restaurantId || "");
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(restaurantId || "");
  const { data: subcategories = [], isLoading: subcategoriesLoading } = useSubcategories(activeCategory);
  const { data: dishes = [], isLoading: dishesLoading } = useDishes(activeSubcategory);
  const updateRestaurant = useUpdateRestaurant();

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
    if (subsForActiveCategory.length > 0) {
      setActiveSubcategory(subsForActiveCategory[0].id);
    } else {
      setActiveSubcategory("");
    }
  }, [subcategories, activeCategory]);

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

  // Sync view mode with restaurant preference
  useEffect(() => {
    if (restaurant?.editor_view_mode) {
      setViewMode(restaurant.editor_view_mode);
    }
  }, [restaurant?.editor_view_mode]);

  // Show skeleton only on initial load, not during refetch
  const isInitialLoading = 
    restaurantLoading || 
    (categoriesLoading && categories.length === 0) || 
    (subcategoriesLoading && activeCategory && subcategories.length === 0) || 
    (dishesLoading && activeSubcategory && dishes.length === 0);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-64 w-full" />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square" />
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
        onPreviewToggle={() => setPreviewMode(!previewMode)}
        onPublishToggle={handlePublishToggle}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onThemeChange={handleThemeChange}
      />

      <RestaurantHeader
        name={restaurant.name}
        tagline={restaurant.tagline || ""}
        heroImageUrl={restaurant.hero_image_url}
        editable={!previewMode}
        restaurantId={restaurant.id}
      />

      <div className="container mx-auto max-w-6xl">
        <EditableCategories
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          restaurantId={restaurant.id}
          previewMode={previewMode}
        />

        {activeCategoryData && (
          <EditableSubcategories
            subcategories={subcategories}
            activeSubcategory={activeSubcategory}
            onSubcategoryChange={setActiveSubcategory}
            categoryId={activeCategory}
            previewMode={previewMode}
          />
        )}

        {activeSubcategory && viewMode === 'grid' && (
          <EditableDishes
            dishes={dishes}
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
      </div>
    </div>
  );
};

export default Editor;
