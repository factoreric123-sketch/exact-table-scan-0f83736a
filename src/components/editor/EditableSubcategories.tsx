import { DndContext, closestCorners, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
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
  const createSubcategory = useCreateSubcategory();
  const updateSubcategoriesOrder = useUpdateSubcategoriesOrder();

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

    const oldIndex = subcategories.findIndex((s) => s.id === active.id);
    const newIndex = subcategories.findIndex((s) => s.id === over.id);

    const newSubcategories = [...subcategories];
    const [movedSubcategory] = newSubcategories.splice(oldIndex, 1);
    newSubcategories.splice(newIndex, 0, movedSubcategory);

    const updates = newSubcategories.map((sub, index) => ({
      id: sub.id,
      order_index: index,
    }));

    updateSubcategoriesOrder.mutate({ subcategories: updates });
  };

  const handleAddSubcategory = async () => {
    try {
      const newSubcategory = await createSubcategory.mutateAsync({
        category_id: categoryId,
        name: "New Subcategory",
        order_index: subcategories.length,
      });
      toast.success("Subcategory added");
      if (newSubcategory) {
        onSubcategoryChange(newSubcategory.id);
      }
    } catch (error) {
      toast.error("Failed to add subcategory");
    }
  };

  if (previewMode) {
    return (
      <nav className="flex gap-8 overflow-x-auto px-4 pb-3 scrollbar-hide">
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
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <SortableContext items={subcategories.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-12 overflow-x-auto scrollbar-hide">
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
            >
              <Plus className="h-3 w-3" />
              Add Subcategory
            </Button>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
