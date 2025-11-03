import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateRestaurant } from "@/hooks/useRestaurants";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageCropModal } from "@/components/ImageCropModal";
import { toast } from "sonner";

interface CreateRestaurantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateRestaurantModal = ({ open, onOpenChange }: CreateRestaurantModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createRestaurant = useCreateRestaurant();
  const uploadImage = useImageUpload();

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSlug = (name: string) => {
    // Normalize Unicode characters (handles accents, etc.)
    const normalized = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
    
    return normalized
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Remove invalid chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
      .slice(0, 60); // Limit length
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setSelectedFile(file);
      setShowCropModal(true);
    }
  };

  const handleImageCropped = async (croppedFile: File) => {
    try {
      const url = await uploadImage.mutateAsync({
        file: croppedFile,
        bucket: "hero-images",
        path: `temp/${croppedFile.name}`,
      });
      setHeroImageUrl(url);
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error("Failed to upload image");
    }
    setShowCropModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !name.trim()) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);

    try {
      const slug = generateSlug(name);
      
      if (!slug) {
        toast.error("Restaurant name must contain at least one letter or number");
        setLoading(false);
        return;
      }

      const newRestaurant = await createRestaurant.mutateAsync({
        owner_id: user.id,
        name: name.trim(),
        slug,
        tagline: tagline.trim() || null,
        hero_image_url: heroImageUrl,
        published: false,
      });

      toast.success("Restaurant created!");
      
      // Clear form on success
      setName("");
      setTagline("");
      setHeroImageUrl(null);
      setSelectedFile(null);
      
      onOpenChange(false);
      navigate(`/editor/${newRestaurant.id}`);
    } catch (error) {
      // Handle slug collision
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("duplicate") || errorMessage.includes("unique")) {
        toast.error("A restaurant with this name already exists. Please choose a different name.");
      } else {
        toast.error(errorMessage || "Failed to create restaurant");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setTagline("");
    setHeroImageUrl(null);
    setSelectedFile(null);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Restaurant</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Restaurant Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Restaurant"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">URL Slug (auto-generated)</Label>
              <Input
                id="slug"
                value={generateSlug(name)}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your menu will be at: yourdomain.com/{generateSlug(name)}
              </p>
            </div>

            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Textarea
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Mediterranean Cuisine"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="hero-image">Hero Image</Label>
              <Input
                id="hero-image"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
              />
              {heroImageUrl && (
                <div className="mt-2">
                  <img
                    src={heroImageUrl}
                    alt="Hero preview"
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Restaurant"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {selectedFile && (
        <ImageCropModal
          open={showCropModal}
          onOpenChange={setShowCropModal}
          imageFile={selectedFile}
          onCropComplete={handleImageCropped}
        />
      )}
    </>
  );
};
