import { useState, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getCroppedImg, compressImage } from "@/utils/imageCompression";
import { logger } from "@/lib/logger";
import { Square, RectangleVertical } from "lucide-react";

interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File;
  onCropComplete: (file: File) => void;
  aspectRatio?: number;
  mode?: 'dish' | 'header';
}

export const ImageCropModal = ({
  open,
  onOpenChange,
  imageFile,
  onCropComplete,
  aspectRatio: initialAspectRatio = 1,
  mode = 'dish',
}: ImageCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedShape, setSelectedShape] = useState<'square' | 'vertical'>(
    initialAspectRatio === 1 ? 'square' : 'vertical'
  );

  // Header mode always uses 16:9 banner ratio
  const currentAspectRatio = mode === 'header' ? 16 / 9 : (selectedShape === 'square' ? 1 : 3 / 4);

  useEffect(() => {
    if (open) {
      setSelectedShape(initialAspectRatio === 1 ? 'square' : 'vertical');
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [open, initialAspectRatio]);

  // Load image when file changes
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: unknown, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setLoading(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], imageFile.name, {
        type: "image/jpeg",
      });
      
      const compressedFile = await compressImage(croppedFile);
      onCropComplete(compressedFile);
    } catch (error) {
      logger.error("Error cropping image:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Shape Toggle - only for dish images */}
          {mode === 'dish' && (
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant={selectedShape === 'square' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedShape('square')}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Square
              </Button>
              <Button
                type="button"
                variant={selectedShape === 'vertical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedShape('vertical')}
                className="flex items-center gap-2"
              >
                <RectangleVertical className="h-4 w-4" />
                Vertical
              </Button>
            </div>
          )}
          {mode === 'header' && (
            <p className="text-center text-sm text-muted-foreground">
              Banner crop (16:9) — looks great on all devices
            </p>
          )}

          <div className="relative w-full h-96 bg-muted">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={currentAspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropCompleteCallback}
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Zoom</label>
            <Slider
              value={[zoom]}
              onValueChange={(values) => setZoom(values[0])}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Processing..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
