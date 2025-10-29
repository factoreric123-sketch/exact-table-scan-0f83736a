import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InlineEdit } from "./InlineEdit";
import { useUpdateDish, useDeleteDish, type Dish } from "@/hooks/useDishes";
import { ImageCropModal } from "@/components/ImageCropModal";
import { useImageUpload } from "@/hooks/useImageUpload";
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
import { toast } from "sonner";

interface SortableDishProps {
  dish: Dish;
  subcategoryId: string;
}

export const SortableDish = ({ dish, subcategoryId }: SortableDishProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: dish.id,
  });
  const updateDish = useUpdateDish();
  const deleteDish = useDeleteDish();
  const uploadImage = useImageUpload();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    opacity: isDragging ? 0.3 : 1,
  };

  const handleUpdate = (field: keyof Dish, value: string | boolean) => {
    updateDish.mutate({
      id: dish.id,
      updates: { [field]: value },
    });
  };

  const handleDelete = () => {
    deleteDish.mutate({ id: dish.id, subcategoryId });
    setShowDeleteDialog(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setShowCropModal(true);
    }
  };

  const handleImageCrop = async (croppedFile: File) => {
    try {
      const imageUrl = await uploadImage.mutateAsync({
        file: croppedFile,
        bucket: "dish-images",
        path: `${dish.id}/${croppedFile.name}`,
      });
      
      updateDish.mutate({
        id: dish.id,
        updates: { image_url: imageUrl },
      });
      
      setShowCropModal(false);
      setSelectedImage(null);
      toast.success("Image updated");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  return (
    <>
      <div ref={setNodeRef} style={style} className="group relative">
        {dish.is_new && (
          <Badge className="absolute top-2 right-2 z-10 bg-new-badge text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            New Addition
          </Badge>
        )}
        
        <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            {...attributes}
            {...listeners}
            className="bg-background/90 backdrop-blur p-1.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-background"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="bg-background/90 backdrop-blur p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-dish-card rounded-2xl overflow-hidden aspect-square mb-2.5 relative shadow-md group/image">
          {dish.image_url ? (
            <img 
              src={dish.image_url} 
              alt={dish.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          
          <label className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur opacity-0 group-hover/image:opacity-100 transition-opacity cursor-pointer">
            <div className="text-center">
              <ImageIcon className="h-8 w-8 mx-auto mb-2" />
              <span className="text-sm font-medium">Change Photo</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <InlineEdit
            value={dish.name}
            onSave={(value) => handleUpdate("name", value)}
            className="text-base font-bold text-foreground mb-1 w-full"
          />
          <InlineEdit
            value={dish.description || ""}
            onSave={(value) => handleUpdate("description", value)}
            className="text-xs text-muted-foreground mb-1.5 w-full"
            multiline
          />
          <InlineEdit
            value={dish.price}
            onSave={(value) => handleUpdate("price", value)}
            className="text-sm font-semibold text-foreground w-full"
          />
        </div>
      </div>

      {selectedImage && (
        <ImageCropModal
          open={showCropModal}
          onOpenChange={setShowCropModal}
          imageFile={selectedImage}
          onCropComplete={handleImageCrop}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dish</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{dish.name}"?
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
