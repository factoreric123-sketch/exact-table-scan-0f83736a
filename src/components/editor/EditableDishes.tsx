import { useState } from "react";
import { DndContext, closestCorners, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { SortableDish } from "./SortableDish";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCreateDish, useUpdateDishesOrder, type Dish } from "@/hooks/useDishes";
import MenuGrid from "@/components/MenuGrid";
import DishCard from "@/components/DishCard";
import { toast } from "sonner";

interface EditableDishesProps {
  dishes: Dish[];
  subcategoryId: string;
  previewMode: boolean;
}

export const EditableDishes = ({
  dishes,
  subcategoryId,
  previewMode,
}: EditableDishesProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const createDish = useCreateDish();
  const updateDishesOrder = useUpdateDishesOrder();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced for more responsive drag
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

    const oldIndex = dishes.findIndex((d) => d.id === active.id);
    const newIndex = dishes.findIndex((d) => d.id === over.id);

    const newDishes = [...dishes];
    const [movedDish] = newDishes.splice(oldIndex, 1);
    newDishes.splice(newIndex, 0, movedDish);

    const updates = newDishes.map((dish, index) => ({
      id: dish.id,
      order_index: index,
    }));

    updateDishesOrder.mutate({ 
      dishes: updates,
      subcategoryId 
    });
  };

  const handleAddDish = async () => {
    try {
      await createDish.mutateAsync({
        subcategory_id: subcategoryId,
        name: "New Dish",
        description: "Add description",
        price: "0.00",
        order_index: dishes.length,
        is_new: false,
      });
      toast.success("Dish added");
    } catch (error) {
      toast.error("Failed to add dish");
    }
  };

  if (previewMode) {
    const dishCards = dishes.map((dish) => ({
      id: dish.id,
      name: dish.name,
      description: dish.description || "",
      price: dish.price,
      image: dish.image_url || "",
      isNew: dish.is_new,
      category: "",
      subcategory: "",
      allergens: dish.allergens || undefined,
      calories: dish.calories || undefined,
      isVegetarian: dish.is_vegetarian,
      isVegan: dish.is_vegan,
      isSpicy: dish.is_spicy,
    }));

    return (
      <MenuGrid dishes={dishCards} sectionTitle="" />
    );
  }

  return (
    <div className="px-4 py-6">
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={dishes.map((d) => d.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
            {dishes.map((dish) => (
              <SortableDish key={dish.id} dish={dish} subcategoryId={subcategoryId} />
            ))}
          </div>
        </SortableContext>
        
        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <div className="bg-dish-card rounded-2xl p-4 shadow-2xl cursor-grabbing opacity-90">
              <div className="font-bold text-foreground">
                {dishes.find(d => d.id === activeId)?.name}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Button
        onClick={handleAddDish}
        variant="outline"
        className="w-full gap-2"
        disabled={createDish.isPending}
      >
        <Plus className="h-4 w-4" />
        {createDish.isPending ? "Adding..." : "Add Dish"}
      </Button>
    </div>
  );
};
