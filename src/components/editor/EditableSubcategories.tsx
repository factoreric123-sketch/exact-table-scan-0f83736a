import { useState, useCallback, memo } from "react";
import { DndContext, closestCorners, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { SortableSubcategory } from "./SortableSubcategory";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCreateSubcategory, useUpdateSubcategoriesOrder, type Subcategory } from "@/hooks/useSubcategories";
import { toast } from "sonner";

interface EditableSubcategoriesProps {
  subcategories: Subcategory[];
  activeSubcategory: string;
  onSubcategoryChange: (subcategoryId: string) => void;
  categoryId: string;
  previewMode: boolean;
}

export const EditableSubcategories = ({
  subcategories,
  activeSubcategory,
  onSubcategoryChange,
  categoryId,
  previewMode,
}: EditableSubcategoriesProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(true); // Instant ready - no delay
  const createSubcategory = useCreateSubcategory();
  const updateSubcategoriesOrder = useUpdateSubcategoriesOrder();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Use immediate update instead of debounce for faster response
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = subcategories.findIndex((s) => s.id === active.id);
    const newIndex = subcategories.findIndex((s) => s.id === over.id);

    const newSubcategories = [...subcategories];
    const [movedSubcategory] = newSubcategories.splice(oldIndex, 1);
    newSubcategories.splice(newIndex, 0, movedSubcategory);

    const updates = newSubcategories.map((sub, index) => ({
      id: sub.id,
      order_index: index,
    }));

    // Fire immediately - no debounce for instant feel
    updateSubcategoriesOrder.mutate({ 
      subcategories: updates,
      categoryId 
    });
  }, [subcategories, categoryId, updateSubcategoriesOrder]);

  const handleAddSubcategory = () => {
    createSubcategory.mutate({
      category_id: categoryId,
      name: "New Subcategory",
      order_index: subcategories.length,
    }, {
      onSuccess: (newSubcategory) => {
        toast.success("Subcategory added");
        // Automatically navigate to the newly created subcategory
        onSubcategoryChange(newSubcategory.id);
      },
      onError: () => {
        toast.error("Failed to add subcategory");
      }
    });
  };

  if (!isReady) {
    return (
      <div className="px-4 pb-3">
        <div className="flex gap-4 border-b">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-20 bg-muted animate-skeleton-pulse mb-3" />
          ))}
        </div>
      </div>
    );
  }

  if (previewMode) {
    return (
      <nav className="flex gap-8 overflow-x-auto px-4 pb-3">
        {subcategories.map((subcategory) => (
          <button
            key={subcategory.id}
            onClick={() => onSubcategoryChange(subcategory.id)}
            className={`
              text-xs font-bold uppercase tracking-wider whitespace-nowrap pb-3 transition-all relative
              ${activeSubcategory === subcategory.id 
                ? 'text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
              }
              ${activeSubcategory === subcategory.id ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground' : ''}
            `}
          >
            {subcategory.name}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <div className="px-4 pb-3">
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd} 
        modifiers={[restrictToHorizontalAxis]}
      >
        <SortableContext items={subcategories.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-12 overflow-x-auto">
            {subcategories.map((subcategory) => (
              <SortableSubcategory
                key={subcategory.id}
                subcategory={subcategory}
                isActive={activeSubcategory === subcategory.id}
                onSubcategoryChange={onSubcategoryChange}
                categoryId={categoryId}
              />
            ))}
            <Button
              onClick={handleAddSubcategory}
              variant="ghost"
              size="sm"
              className="text-xs font-bold uppercase tracking-wider whitespace-nowrap gap-2 shrink-0"
              disabled={createSubcategory.isPending}
            >
              <Plus className="h-3 w-3" />
              {createSubcategory.isPending ? "Adding..." : "Add Subcategory"}
            </Button>
          </div>
        </SortableContext>
        
        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <div className="px-4 py-2 rounded-lg bg-background border-2 border-primary text-foreground font-medium shadow-lg cursor-grabbing whitespace-nowrap">
              {subcategories.find(s => s.id === activeId)?.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
