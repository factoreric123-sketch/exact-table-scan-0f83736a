import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, EyeOff, QrCode, Palette, Upload, Undo2, Redo2, LayoutGrid, Table2, Settings, Share2, RefreshCw, Check } from "lucide-react";
import { QRCodeModal } from "@/components/editor/QRCodeModal";
import { ShareDialog } from "@/components/editor/ShareDialog";
import { ThemeGalleryModal } from "@/components/editor/ThemeGalleryModal";
import { PaywallModal } from "@/components/PaywallModal";
import { RestaurantSettingsDialog } from "@/components/editor/RestaurantSettingsDialog";
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
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onThemeChange?: (theme: Theme) => void;
  onFilterToggle?: () => void;
  onRefresh?: () => void;
  onUpdate?: () => Promise<void>;
}

export const EditorTopBar = ({
  restaurant,
  previewMode,
  viewMode,
  onViewModeChange,
  onPreviewToggle,
  onPublishToggle,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onThemeChange,
  onFilterToggle,
  onRefresh,
  onUpdate,
}: EditorTopBarProps) => {
  const navigate = useNavigate();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdated, setIsUpdated] = useState(true);
  const { hasPremium } = useSubscription();

  // Track changes to detect when update is needed
  useEffect(() => {
    const lastSync = localStorage.getItem(`lastSync:${restaurant.id}`);
    const currentVersion = restaurant.updated_at;
    
    if (lastSync !== currentVersion) {
      setIsUpdated(false);
    }
  }, [restaurant.updated_at, restaurant.id]);

  const handleUpdateClick = async () => {
    if (!onUpdate) return;
    
    setIsUpdating(true);
    try {
      await onUpdate();
      localStorage.setItem(`lastSync:${restaurant.id}`, restaurant.updated_at || '');
      setIsUpdated(true);
      
      // Show "Updated" state briefly
      setTimeout(() => {
        setIsUpdated(true);
      }, 1000);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

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
      // Auto-open share dialog after publishing
      if (!restaurant.published) {
        setTimeout(() => setShowShareDialog(true), 500);
      }
    } else {
      setPaywallFeature("Menu Publishing");
      setShowPaywall(true);
    }
  };

  const handleShareClick = () => {
    if (hasPremium) {
      setShowShareDialog(true);
    } else {
      setPaywallFeature("Menu Sharing");
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
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-lg font-bold">{restaurant.name}</h1>
                <p className="text-xs text-muted-foreground">
                  {viewMode === 'grid' ? 'Visual Editor' : 'Table Editor'}
                </p>
              </div>
              {!restaurant.published && (
                <Badge variant="secondary" className="text-xs">
                  Unpublished
                </Badge>
              )}
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
                  onClick={() => setShowSettingsDialog(true)}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
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
                  variant="outline"
                  size="sm"
                  onClick={handleShareClick}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </>
            )}

            {!previewMode && (
              <Button
                variant={isUpdated ? "secondary" : "default"}
                size="sm"
                onClick={handleUpdateClick}
                disabled={isUpdating || isUpdated}
                className="gap-2"
                title={isUpdated ? "All changes synced" : "Sync changes to live menu"}
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : isUpdated ? (
                  <>
                    <Check className="h-4 w-4" />
                    Updated
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Update
                  </>
                )}
              </Button>
            )}

            <Button
              variant={restaurant.published ? "secondary" : "default"}
              size="sm"
              onClick={handlePublishClick}
              className="gap-2"
              title={restaurant.published ? "Unpublish menu" : "Publish menu to make it live"}
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
        isPublished={restaurant.published}
      />

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        restaurantSlug={restaurant.slug}
        restaurantName={restaurant.name}
        isPublished={restaurant.published}
      />

      <ThemeGalleryModal
        open={showThemeDialog}
        onOpenChange={setShowThemeDialog}
        restaurant={restaurant}
        onThemeChange={onThemeChange}
      />

      {onFilterToggle && (
        <RestaurantSettingsDialog
          open={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
          restaurant={restaurant}
          onFilterToggle={onFilterToggle}
          onSettingsUpdate={() => onRefresh?.()}
        />
      )}

      <PaywallModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        feature={paywallFeature}
      />
    </>
  );
};
