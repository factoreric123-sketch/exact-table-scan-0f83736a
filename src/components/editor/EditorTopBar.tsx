import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff, QrCode, Palette, Upload, Undo2, Redo2, LayoutGrid, Table2, Filter } from "lucide-react";
import { QRCodeModal } from "@/components/editor/QRCodeModal";
import { ThemeGalleryModal } from "@/components/editor/ThemeGalleryModal";
import { PaywallModal } from "@/components/PaywallModal";
import { useSubscription } from "@/hooks/useSubscription";
import type { Restaurant } from "@/hooks/useRestaurants";
import { Theme } from "@/lib/types/theme";

interface EditorTopBarProps {
  restaurant: Restaurant;
  previewMode: boolean;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  onPreviewToggle: () => void;
  onPublishToggle: () => void;
  onFilterToggle: () => void;
  filterOpen?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onThemeChange?: (theme: Theme) => void;
  filterSheetTrigger?: React.ReactNode;
}

export const EditorTopBar = ({
  restaurant,
  previewMode,
  viewMode,
  onViewModeChange,
  onPreviewToggle,
  onPublishToggle,
  onFilterToggle,
  filterOpen = false,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onThemeChange,
  filterSheetTrigger,
}: EditorTopBarProps) => {
  const navigate = useNavigate();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState("");
  const { hasPremium } = useSubscription();

  const handleQRCodeClick = () => {
    if (hasPremium) {
      setShowQRModal(true);
    } else {
      setPaywallFeature("QR Code Generation");
      setShowPaywall(true);
    }
  };

  const handlePublishClick = () => {
    if (hasPremium || restaurant.published) {
      onPublishToggle();
    } else {
      setPaywallFeature("Menu Publishing");
      setShowPaywall(true);
    }
  };

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
              <p className="text-xs text-muted-foreground">
                {viewMode === 'grid' ? 'Visual Editor' : 'Table Editor'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!previewMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewModeChange(viewMode === 'grid' ? 'table' : 'grid')}
                className="gap-2"
              >
                {viewMode === 'grid' ? (
                  <>
                    <Table2 className="h-4 w-4" />
                    Table View
                  </>
                ) : (
                  <>
                    <LayoutGrid className="h-4 w-4" />
                    Grid View
                  </>
                )}
              </Button>
            )}

            {previewMode && restaurant.show_allergen_filter !== false && filterSheetTrigger}

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
                  onClick={handleQRCodeClick}
                  className="gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  QR Code
                </Button>

                <Button
                  variant={restaurant.show_allergen_filter !== false ? "default" : "outline"}
                  size="sm"
                  onClick={onFilterToggle}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </>
            )}

            <Button
              variant={restaurant.published ? "secondary" : "default"}
              size="sm"
              onClick={handlePublishClick}
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

      <PaywallModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        feature={paywallFeature}
      />
    </>
  );
};
