import { useState } from "react";
import { DndContext, closestCorners, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableCategory } from "./SortableCategory";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCreateCategory, useUpdateCategoriesOrder, type Category } from "@/hooks/useCategories";
import { toast } from "sonner";

interface EditableCategoriesProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  restaurantId: string;
  previewMode: boolean;
}

export const EditableCategories = ({
  categories,
  activeCategory,
  onCategoryChange,
  restaurantId,
  previewMode,
}: EditableCategoriesProps) => {
  const createCategory = useCreateCategory();
  const updateCategoriesOrder = useUpdateCategoriesOrder();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);

    const newCategories = [...categories];
    const [movedCategory] = newCategories.splice(oldIndex, 1);
    newCategories.splice(newIndex, 0, movedCategory);

    const updates = newCategories.map((cat, index) => ({
      id: cat.id,
      order_index: index,
    }));

    updateCategoriesOrder.mutate({ categories: updates });
  };

  const handleAddCategory = async () => {
    try {
      const newCategory = await createCategory.mutateAsync({
        restaurant_id: restaurantId,
        name: "New Category",
        order_index: categories.length,
      });
      toast.success("Category added");
      if (newCategory) {
        onCategoryChange(newCategory.id);
      }
    } catch (error) {
      toast.error("Failed to add category");
    }
  };

  if (previewMode) {
    return (
      <nav className="flex gap-3 overflow-x-auto pb-3 pt-4 px-4 scrollbar-hide">
        {categories.map((category) => (
          <Button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            variant={activeCategory === category.id ? "default" : "ghost"}
            className={`
              px-5 py-2 rounded-full whitespace-nowrap font-semibold text-sm transition-all
              ${activeCategory === category.id 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'text-foreground hover:bg-muted'
              }
            `}
          >
            {category.name}
          </Button>
        ))}
      </nav>
    );
  }

  return (
    <div className="pt-4 px-4">
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-6 overflow-x-auto pb-3 scrollbar-hide">
            {categories.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                isActive={activeCategory === category.id}
                onCategoryChange={onCategoryChange}
                restaurantId={restaurantId}
              />
            ))}
            <Button
              onClick={handleAddCategory}
              variant="outline"
              size="sm"
              className="rounded-full whitespace-nowrap gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
