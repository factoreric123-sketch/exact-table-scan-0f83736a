import { useState, useRef } from "react";
import {
  DndContext,
  closestCorners,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { SortableDish } from "./SortableDish";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { type Dish } from "@/hooks/useDishes";
import { useSubcategoryDishesWithOptions } from "@/hooks/useSubcategoryDishesWithOptions";
import MenuGrid from "@/components/MenuGrid";
import { useMenuData } from "@/contexts/MenuDataContext";

interface EditableDishesProps {
  dishes: Dish[];
  subcategoryId: string;
  previewMode: boolean;
  restaurant?: any;
}

export const EditableDishes = ({
  dishes,
  subcategoryId,
  previewMode,
  restaurant,
}: EditableDishesProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isReordering = useRef(false);
  
  // Use MenuDataContext for instant sync to preview
  const { addDish, reorderDishes } = useMenuData();

  // Only fetch options/modifiers if NOT in preview mode AND dishes don't already have them
  const dishesAlreadyHaveOptions =
    dishes.length > 0 &&
    dishes.some(
      (d: any) => Array.isArray(d.options) || Array.isArray(d.modifiers)
    );

  const { data: dishesWithOptions } = useSubcategoryDishesWithOptions(
    dishes,
    !previewMode && !dishesAlreadyHaveOptions
  );

  // Prevent flicker by ensuring content is ready
  useState(() => {
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (isReordering.current) return;
    isReordering.current = true;

    const oldIndex = dishes.findIndex((d) => d.id === active.id);
    const newIndex = dishes.findIndex((d) => d.id === over.id);

    const newDishes = [...dishes];
    const [movedDish] = newDishes.splice(oldIndex, 1);
    newDishes.splice(newIndex, 0, movedDish);

    // Use context for instant sync
    const orderedIds = newDishes.map(d => d.id);
    reorderDishes(subcategoryId, orderedIds);

    setTimeout(() => {
      isReordering.current = false;
    }, 100);
  };

  const handleAddDish = () => {
    // Use context for instant sync
    addDish(subcategoryId, {
      name: "New Dish",
      description: "Add description",
      price: "0.00",
    });
  };

  if (!isReady) {
    return (
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square rounded-2xl bg-muted animate-skeleton-pulse" />
              <div className="h-4 w-3/4 bg-muted animate-skeleton-pulse" />
              <div className="h-3 w-1/2 bg-muted animate-skeleton-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (previewMode) {
    // In preview mode, dishes from fullMenuData already have options/modifiers embedded
    // Only fall back to dishesWithOptions if base dishes don't have options
    const dishesData = dishesAlreadyHaveOptions
      ? dishes
      : dishesWithOptions || dishes;

    const dishCards = dishesData.map((dish) => {
      const dishWithOptions = dish as any;
      const hasOptionsArray = Array.isArray(dishWithOptions.options);
      const hasModifiersArray = Array.isArray(dishWithOptions.modifiers);

      return {
        id: dish.id,
        name: dish.name,
        description: dish.description || "",
        price: dish.price,
        image: dish.image_url || "",
        isNew: dish.is_new,
        isSpecial: dish.is_special,
        isPopular: dish.is_popular,
        isChefRecommendation: dish.is_chef_recommendation,
        category: "",
        subcategory: "",
        allergens: dish.allergens || undefined,
        calories: dish.calories || undefined,
        isVegetarian: dish.is_vegetarian,
        isVegan: dish.is_vegan,
        isSpicy: dish.is_spicy,
        hasOptions:
          dish.has_options ||
          (hasOptionsArray && dishWithOptions.options.length > 0),
        options: hasOptionsArray ? dishWithOptions.options : undefined,
        modifiers: hasModifiersArray ? dishWithOptions.modifiers : undefined,
      };
    });

    return (
      <MenuGrid
        key={restaurant?.updated_at} // Force re-render when settings change
        dishes={dishCards}
        sectionTitle=""
        showPrice={restaurant?.show_prices !== false}
        showImage={restaurant?.show_images !== false}
        gridColumns={restaurant?.grid_columns || 2}
        layoutDensity={restaurant?.layout_density || "spacious"}
        fontSize={restaurant?.menu_font_size || "medium"}
        imageSize={restaurant?.image_size || "large"}
        badgeColors={restaurant?.badge_colors}
      />
    );
  }

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
      <DndContext
        sensors={isReordering.current ? [] : sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={dishes.map((d) => d.id)}
          strategy={rectSortingStrategy}
        >
          {/* Responsive Grid */}
          <div
            className="
          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          lg:grid-cols-4
          gap-4 sm:gap-5 lg:gap-6
          mb-6
        "
          >
            {dishes.map((dish) => (
              <SortableDish
                key={dish.id}
                dish={dish}
                subcategoryId={subcategoryId}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <div className="bg-dish-card rounded-xl p-3 sm:p-4 shadow-2xl cursor-grabbing opacity-95 max-w-[90vw]">
              <div className="font-bold text-sm sm:text-base text-foreground truncate">
                {dishes.find((d) => d.id === activeId)?.name}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add Dish Button */}
      <Button
        onClick={handleAddDish}
        variant="outline"
        className="w-full gap-2 mt-2 sm:mt-4"
      >
        <Plus className="h-4 w-4" />
        Add Dish
      </Button>
    </div>
  );
};
