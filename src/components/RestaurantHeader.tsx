import { useState, memo, useCallback } from "react";
import { ImageCropModal } from "./ImageCropModal";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useUpdateRestaurant } from "@/hooks/useRestaurants";
import { InlineEdit } from "./editor/InlineEdit";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import heroImage from "@/assets/restaurant-hero.jpg";

interface RestaurantHeaderProps {
  name: string;
  tagline?: string;
  heroImageUrl?: string | null;
  editable?: boolean;
  restaurantId?: string;
}

const RestaurantHeader = memo(({ 
  name, 
  tagline = "", 
  heroImageUrl, 
  editable = false, 
  restaurantId 
}: RestaurantHeaderProps) => {
  const uploadImage = useImageUpload();
  const updateRestaurant = useUpdateRestaurant();
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        toast.error("Image must be smaller than 10MB");
        return;
      }

      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a valid image file (JPEG, PNG, WebP, or GIF)");
        return;
      }

      setSelectedImage(file);
      setShowCropModal(true);
    }
  }, []);

  const handleImageCrop = useCallback(async (croppedFile: File) => {
    if (!restaurantId) return;
    
    try {
      const imageUrl = await uploadImage.mutateAsync({
        file: croppedFile,
        bucket: "hero-images",
        path: `${restaurantId}/${croppedFile.name}`,
      });
      
      await updateRestaurant.mutateAsync({
        id: restaurantId,
        updates: { hero_image_url: imageUrl },
      });
      
      setShowCropModal(false);
      setSelectedImage(null);
      toast.success("Hero image updated");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  }, [restaurantId, uploadImage, updateRestaurant]);

  const handleNameUpdate = useCallback(async (newName: string) => {
    if (!restaurantId || !newName.trim()) return;
    try {
      await updateRestaurant.mutateAsync({
        id: restaurantId,
        updates: { name: newName.trim() },
      });
    } catch (error) {
      toast.error("Failed to update name");
    }
  }, [restaurantId, updateRestaurant]);

  const handleTaglineUpdate = useCallback(async (newTagline: string) => {
    if (!restaurantId) return;
    try {
      await updateRestaurant.mutateAsync({
        id: restaurantId,
        updates: { tagline: newTagline.trim() },
      });
    } catch (error) {
      toast.error("Failed to update tagline");
    }
  }, [restaurantId, updateRestaurant]);

  const displayImage = heroImageUrl || heroImage;

  return (
    <>
      <header className="relative w-full h-64 md:h-80 overflow-hidden group">
        <img 
          src={displayImage} 
          alt="Restaurant ambiance" 
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        
        {editable && (
          <label className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
            <div className="text-center">
              <Camera className="h-12 w-12 mx-auto mb-2 text-foreground" />
              <span className="text-sm font-medium text-foreground">Change Hero Image</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
          {editable ? (
            <>
              <InlineEdit
                value={name}
                onSave={handleNameUpdate}
                className="text-4xl md:text-5xl font-bold mb-2 text-foreground drop-shadow-lg"
              />
              <InlineEdit
                value={tagline}
                onSave={handleTaglineUpdate}
                className="text-base md:text-lg text-muted-foreground drop-shadow"
              />
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 text-foreground drop-shadow-lg">
                {name}
              </h1>
              {tagline && (
                <p className="text-base md:text-lg text-muted-foreground drop-shadow">
                  {tagline}
                </p>
              )}
            </>
          )}
        </div>
      </header>

      {selectedImage && (
        <ImageCropModal
          open={showCropModal}
          onOpenChange={setShowCropModal}
          imageFile={selectedImage}
          onCropComplete={handleImageCrop}
        />
      )}
    </>
  );
});

RestaurantHeader.displayName = 'RestaurantHeader';

export default RestaurantHeader;
