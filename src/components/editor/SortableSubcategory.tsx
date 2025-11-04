import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { InlineEdit } from "./InlineEdit";
import { useUpdateSubcategory, useDeleteSubcategory, type Subcategory } from "@/hooks/useSubcategories";
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

interface SortableSubcategoryProps {
  subcategory: Subcategory;
  isActive: boolean;
  onSubcategoryChange: (subcategoryId: string) => void;
  categoryId: string;
}

export const SortableSubcategory = ({
  subcategory,
  isActive,
  onSubcategoryChange,
  categoryId,
}: SortableSubcategoryProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subcategory.id,
  });
  const updateSubcategory = useUpdateSubcategory();
  const deleteSubcategory = useDeleteSubcategory();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    opacity: isDragging ? 0.5 : 1,
  };

  const handleNameUpdate = (newName: string) => {
    if (newName.trim() && newName !== subcategory.name) {
      updateSubcategory.mutate({
        id: subcategory.id,
        updates: { name: newName.trim() },
      });
    }
  };

  const handleDelete = () => {
    deleteSubcategory.mutate({ id: subcategory.id, categoryId });
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
          onClick={() => onSubcategoryChange(subcategory.id)}
          role="button"
          aria-pressed={isActive}
          className={`
            text-xs font-bold uppercase tracking-wider whitespace-nowrap pb-3 transition-all relative flex items-center gap-2
            cursor-grab active:cursor-grabbing select-none
            min-w-[100px]
            ${isActive 
              ? 'text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
            }
            ${isActive ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground' : ''}
          `}
        >
          <span 
            className="opacity-50 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-3 w-3" />
          </span>
          <div onClick={(e) => e.stopPropagation()}>
            <InlineEdit
              value={subcategory.name}
              onSave={handleNameUpdate}
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs font-bold uppercase tracking-wider"
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
            type="button"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{subcategory.name}"? This will also delete all dishes within it.
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
