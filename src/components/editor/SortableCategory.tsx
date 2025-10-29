import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2 } from "lucide-react";
import { InlineEdit } from "./InlineEdit";
import { useUpdateCategory, useDeleteCategory, type Category } from "@/hooks/useCategories";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SortableCategoryProps {
  category: Category;
  isActive: boolean;
  onCategoryChange: (categoryId: string) => void;
  restaurantId: string;
}

export const SortableCategory = ({
  category,
  isActive,
  onCategoryChange,
  restaurantId,
}: SortableCategoryProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    opacity: isDragging ? 0.5 : 1,
  };

  const handleNameUpdate = (newName: string) => {
    if (newName.trim() && newName !== category.name) {
      updateCategory.mutate({
        id: category.id,
        updates: { name: newName.trim() },
      });
    }
  };

  const handleDelete = () => {
    deleteCategory.mutate({ id: category.id, restaurantId });
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="group relative shrink-0 mx-1"
      >
        <div
          {...attributes}
          {...listeners}
          onClick={() => onCategoryChange(category.id)}
          role="button"
          aria-pressed={isActive}
          className={`
            px-6 py-2 rounded-full whitespace-nowrap font-semibold text-sm transition-all min-w-[120px]
            cursor-grab active:cursor-grabbing inline-flex items-center gap-2 select-none
            ${isActive 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'text-foreground hover:bg-muted'
            }
          `}
        >
          <span
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </span>
          <InlineEdit
            value={category.name}
            onSave={handleNameUpdate}
            className="bg-transparent border-none focus:outline-none focus:ring-0"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{category.name}"? This will also delete all subcategories and dishes within it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
