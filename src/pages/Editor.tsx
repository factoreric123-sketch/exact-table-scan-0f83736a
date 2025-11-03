import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRestaurantById, useUpdateRestaurant } from "@/hooks/useRestaurants";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategoriesByRestaurant } from "@/hooks/useSubcategories";
import { useDishesByRestaurant } from "@/hooks/useDishes";
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
  const { data: restaurant, isLoading: restaurantLoading } = useRestaurantById(restaurantId || "");
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(restaurantId || "");
  const { data: subcategories = [], isLoading: subcategoriesLoading } = useSubcategoriesByRestaurant(restaurantId || "");
  const { data: dishes = [], isLoading: dishesLoading } = useDishesByRestaurant(restaurantId || "");
  const updateRestaurant = useUpdateRestaurant();

  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("");
  const [previewMode, setPreviewMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(restaurant?.editor_view_mode || 'grid');

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
      updateRestaurant.mutate({ id: restaurant.id, updates: { theme: prevTheme as any } });
    }
  };

  const handleRedo = () => {
    const nextTheme = redo();
    if (nextTheme && restaurant) {
      updateRestaurant.mutate({ id: restaurant.id, updates: { theme: nextTheme as any } });
    }
  };

  const handleThemeChange = (theme: Theme) => {
    push(theme);
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !previewMode) {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, previewMode]);

  // Set initial active category
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // Set initial active subcategory when category changes
  useEffect(() => {
    const subsForActiveCategory = subcategories.filter(s => s.category_id === activeCategory);
    if (subsForActiveCategory.length > 0 && !activeSubcategory) {
      setActiveSubcategory(subsForActiveCategory[0].id);
    }
  }, [subcategories, activeCategory, activeSubcategory]);

  const handlePublishToggle = async () => {
    if (!restaurant) return;
    
    try {
      await updateRestaurant.mutateAsync({
        id: restaurant.id,
        updates: { published: !restaurant.published }
      });
      toast.success(restaurant.published ? "Menu unpublished" : "Menu published!");
    } catch (error) {
      toast.error("Failed to update publish status");
    }
  };

  const handleViewModeChange = async (mode: 'grid' | 'table') => {
    setViewMode(mode);
    if (restaurant) {
      await updateRestaurant.mutateAsync({
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

  if (restaurantLoading || categoriesLoading || subcategoriesLoading || dishesLoading) {
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
  const subsForActiveCategory = subcategories.filter(s => s.category_id === activeCategory);
  const dishesForActiveSubcategory = dishes.filter(d => d.subcategory_id === activeSubcategory);

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
            subcategories={subsForActiveCategory}
            activeSubcategory={activeSubcategory}
            onSubcategoryChange={setActiveSubcategory}
            categoryId={activeCategory}
            previewMode={previewMode}
          />
        )}

        {activeSubcategory && viewMode === 'grid' && (
          <EditableDishes
            dishes={dishesForActiveSubcategory}
            subcategoryId={activeSubcategory}
            previewMode={previewMode}
          />
        )}

        {activeSubcategory && viewMode === 'table' && (
          <SpreadsheetView
            dishes={dishesForActiveSubcategory}
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
