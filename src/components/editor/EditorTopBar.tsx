import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff, QrCode, Palette, Upload, Undo2, Redo2 } from "lucide-react";
import { QRCodeModal } from "@/components/editor/QRCodeModal";
import { ThemeGalleryModal } from "@/components/editor/ThemeGalleryModal";
import type { Restaurant } from "@/hooks/useRestaurants";
import { Theme } from "@/lib/types/theme";

interface EditorTopBarProps {
  restaurant: Restaurant;
  previewMode: boolean;
  onPreviewToggle: () => void;
  onPublishToggle: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onThemeChange?: (theme: Theme) => void;
}

export const EditorTopBar = ({
  restaurant,
  previewMode,
  onPreviewToggle,
  onPublishToggle,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onThemeChange,
}: EditorTopBarProps) => {
  const navigate = useNavigate();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
            <div className="border-l border-border h-6" />
            <div>
              <h1 className="text-lg font-bold">{restaurant.name}</h1>
              <p className="text-xs text-muted-foreground">Visual Editor</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPreviewToggle}
              className="gap-2"
            >
              {previewMode ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Exit Preview
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Preview
                </>
              )}
            </Button>

            {!previewMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="gap-2"
                >
                  <Undo2 className="h-4 w-4" />
                  Undo
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="gap-2"
                >
                  <Redo2 className="h-4 w-4" />
                  Redo
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowThemeDialog(true)}
                  className="gap-2"
                >
                  <Palette className="h-4 w-4" />
                  Theme
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQRModal(true)}
                  className="gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  QR Code
                </Button>
              </>
            )}

            <Button
              variant={restaurant.published ? "secondary" : "default"}
              size="sm"
              onClick={onPublishToggle}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {restaurant.published ? "Unpublish" : "Publish"}
            </Button>
          </div>
        </div>
      </header>

      <QRCodeModal
        open={showQRModal}
        onOpenChange={setShowQRModal}
        restaurantSlug={restaurant.slug}
        restaurantName={restaurant.name}
      />

      <ThemeGalleryModal
        open={showThemeDialog}
        onOpenChange={setShowThemeDialog}
        restaurant={restaurant}
        onThemeChange={onThemeChange}
      />
    </>
  );
};
