import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCorners,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableDish } from '@/components/editor/SortableDish';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useMenuData, DishData } from '@/contexts/MenuDataContext';

interface EditorDishGridProps {
  dishes: DishData[];
  subcategoryId: string;
}

/**
 * Editable dish grid for Editor mode
 * Uses MenuDataContext for instant updates
 */
export const EditorDishGrid = ({ dishes, subcategoryId }: EditorDishGridProps) => {
  const { addDish, reorderDishes } = useMenuData();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

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
    if (!over || active.id === over.id || isReordering) return;

    setIsReordering(true);

    const oldIndex = dishes.findIndex(d => d.id === active.id);
    const newIndex = dishes.findIndex(d => d.id === over.id);

    const newDishes = [...dishes];
    const [movedDish] = newDishes.splice(oldIndex, 1);
    newDishes.splice(newIndex, 0, movedDish);

    const orderedIds = newDishes.map(d => d.id);
    reorderDishes(subcategoryId, orderedIds);

    // Reset reordering flag after a short delay
    setTimeout(() => setIsReordering(false), 500);
  };

  const handleAddDish = useCallback(() => {
    addDish(subcategoryId, {
      name: 'New Dish',
      description: 'Add description',
      price: '0.00',
      is_new: false,
    });
  }, [addDish, subcategoryId]);

  // Transform DishData to the format SortableDish expects
  const transformedDishes = dishes.map(dish => ({
    id: dish.id,
    subcategory_id: dish.subcategory_id,
    name: dish.name,
    description: dish.description,
    price: dish.price,
    image_url: dish.image_url,
    is_new: dish.is_new,
    is_special: dish.is_special,
    is_popular: dish.is_popular,
    is_chef_recommendation: dish.is_chef_recommendation,
    order_index: dish.order_index,
    created_at: '',
    allergens: dish.allergens,
    calories: dish.calories,
    is_vegetarian: dish.is_vegetarian,
    is_vegan: dish.is_vegan,
    is_spicy: dish.is_spicy,
    has_options: dish.has_options,
  }));

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
      <DndContext
        sensors={isReordering ? [] : sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={dishes.map(d => d.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-6">
            {transformedDishes.map(dish => (
              <SortableDish
                key={dish.id}
                dish={dish}
                subcategoryId={subcategoryId}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <div className="bg-dish-card rounded-xl p-3 sm:p-4 shadow-2xl cursor-grabbing opacity-95 max-w-[90vw]">
              <div className="font-bold text-sm sm:text-base text-foreground truncate">
                {dishes.find(d => d.id === activeId)?.name}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
