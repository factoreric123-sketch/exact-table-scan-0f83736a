import { useState } from "react";
import { DndContext, closestCorners, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
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
  filterSheetTrigger?: React.ReactNode;
}

export const EditableCategories = ({
  categories,
  activeCategory,
  onCategoryChange,
  restaurantId,
  previewMode,
  filterSheetTrigger,
}: EditableCategoriesProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const createCategory = useCreateCategory();
  const updateCategoriesOrder = useUpdateCategoriesOrder();

  // Prevent flicker by ensuring content is ready
  useState(() => {
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  });

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

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);

    const newCategories = [...categories];
    const [movedCategory] = newCategories.splice(oldIndex, 1);
    newCategories.splice(newIndex, 0, movedCategory);

    const updates = newCategories.map((cat, index) => ({
      id: cat.id,
      order_index: index,
    }));

    updateCategoriesOrder.mutate({ 
      categories: updates,
      restaurantId 
    });
  };

  const handleAddCategory = () => {
    createCategory.mutate({
      restaurant_id: restaurantId,
      name: "New Category",
      order_index: categories.length,
    }, {
      onSuccess: (newCategory) => {
        toast.success("Category added");
        // Automatically navigate to the newly created category
        onCategoryChange(newCategory.id);
      },
      onError: () => {
        toast.error("Failed to add category");
      }
    });
  };

  if (!isReady) {
    return (
      <div className="pt-4 px-4">
        <div className="flex gap-3 pb-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 rounded-full bg-muted animate-skeleton-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (previewMode) {
    return (
      <nav className="flex gap-3 justify-between items-center overflow-x-auto pb-3 pt-4 px-4">
        <div className="flex gap-3 overflow-x-auto">
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
        </div>
        {filterSheetTrigger && (
          <div className="flex-shrink-0">
            {filterSheetTrigger}
          </div>
        )}
      </nav>
    );
  }

  return (
   <div className="pt-4 px-3 sm:px-4">
  <DndContext
    sensors={sensors}
    collisionDetection={closestCorners}
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
    modifiers={[restrictToHorizontalAxis]}
  >
    <SortableContext
      items={categories.map((c) => c.id)}
      strategy={horizontalListSortingStrategy}
    >
      {/* Scroll Container */}
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div
          className="
            flex items-center
            gap-4 sm:gap-6 lg:gap-8
            min-w-max
            pb-3
            snap-x snap-mandatory
          "
        >
          {categories.map((category) => (
            <div key={category.id} className="snap-start shrink-0">
              <SortableCategory
                category={category}
                isActive={activeCategory === category.id}
                onCategoryChange={onCategoryChange}
                restaurantId={restaurantId}
              />
            </div>
          ))}

          {/* Add Button */}
          <Button
            onClick={handleAddCategory}
            variant="outline"
            size="sm"
            className="
              rounded-full
              whitespace-nowrap
              gap-2
              shrink-0
              snap-start
            "
            disabled={createCategory.isPending}
          >
            <Plus className="h-4 w-4" />
            {createCategory.isPending ? "Adding..." : "Add Category"}
          </Button>
        </div>
      </div>
    </SortableContext>

    {/* Drag Overlay */}
    <DragOverlay dropAnimation={null}>
      {activeId ? (
        <div className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-medium shadow-lg cursor-grabbing">
          {categories.find((c) => c.id === activeId)?.name}
        </div>
      ) : null}
    </DragOverlay>
  </DndContext>
</div>

  );
};
