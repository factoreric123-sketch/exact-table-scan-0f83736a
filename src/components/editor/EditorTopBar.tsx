// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { ArrowLeft, Eye, EyeOff, QrCode, Palette, Upload, Undo2, Redo2, LayoutGrid, Table2, Settings, Share2, RefreshCw, Check } from "lucide-react";
// import { QRCodeModal } from "@/components/editor/QRCodeModal";
// import { ShareDialog } from "@/components/editor/ShareDialog";
// import { ThemeGalleryModal } from "@/components/editor/ThemeGalleryModal";
// import { PaywallModal } from "@/components/PaywallModal";
// import { RestaurantSettingsDialog } from "@/components/editor/RestaurantSettingsDialog";
// import { useSubscription } from "@/hooks/useSubscription";
// import type { Restaurant } from "@/hooks/useRestaurants";
// import { Theme } from "@/lib/types/theme";

// interface EditorTopBarProps {
//   restaurant: Restaurant;
//   previewMode: boolean;
//   viewMode: 'grid' | 'table';
//   onViewModeChange: (mode: 'grid' | 'table') => void;
//   onPreviewToggle: () => void;
//   onPublishToggle: () => void;
//   onUndo?: () => void;
//   onRedo?: () => void;
//   canUndo?: boolean;
//   canRedo?: boolean;
//   onThemeChange?: (theme: Theme) => void;
//   onFilterToggle?: () => void;
//   onRefresh?: () => void;
//   onUpdate?: () => Promise<void>;
//   hasPendingChanges?: boolean;
// }

// export const EditorTopBar = ({
//   restaurant,
//   previewMode,
//   viewMode,
//   onViewModeChange,
//   onPreviewToggle,
//   onPublishToggle,
//   onUndo,
//   onRedo,
//   canUndo = false,
//   canRedo = false,
//   onThemeChange,
//   onFilterToggle,
//   onRefresh,
//   onUpdate,
//   hasPendingChanges = false,
// }: EditorTopBarProps) => {
//   const navigate = useNavigate();
//   const [showQRModal, setShowQRModal] = useState(false);
//   const [showShareDialog, setShowShareDialog] = useState(false);
//   const [showThemeDialog, setShowThemeDialog] = useState(false);
//   const [showSettingsDialog, setShowSettingsDialog] = useState(false);
//   const [showPaywall, setShowPaywall] = useState(false);
//   const [paywallFeature, setPaywallFeature] = useState("");
//   const [isUpdating, setIsUpdating] = useState(false);
//   const { hasPremium } = useSubscription();

//   const handleUpdateClick = async () => {
//     if (!onUpdate) return;
    
//     setIsUpdating(true);
//     try {
//       await onUpdate();
//     } catch (error) {
//       console.error('Update failed:', error);
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const handleQRCodeClick = () => {
//     if (hasPremium) {
//       setShowQRModal(true);
//     } else {
//       setPaywallFeature("QR Code Generation");
//       setShowPaywall(true);
//     }
//   };

//   const handlePublishClick = () => {
//     if (hasPremium || restaurant.published) {
//       onPublishToggle();
//       // Auto-open share dialog after publishing
//       if (!restaurant.published) {
//         setTimeout(() => setShowShareDialog(true), 500);
//       }
//     } else {
//       setPaywallFeature("Menu Publishing");
//       setShowPaywall(true);
//     }
//   };

//   const handleShareClick = () => {
//     if (hasPremium) {
//       setShowShareDialog(true);
//     } else {
//       setPaywallFeature("Menu Sharing");
//       setShowPaywall(true);
//     }
//   };

//   return (
//     <>
//       <header className="sticky  top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
//         <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
//           <div className="flex items-center gap-3">
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={() => navigate("/dashboard")}
//               className="gap-2"
//             >
//               <ArrowLeft className="h-4 w-4" />
//               Dashboard
//             </Button>
//             <div className="border-l border-border h-6" />
//             <div className="flex items-center gap-2">
//               <div>
//                 <h1 className="text-lg font-bold">{restaurant.name}</h1>
//                 <p className="text-xs text-muted-foreground">
//                   {viewMode === 'grid' ? 'Visual Editor' : 'Table Editor'}
//                 </p>
//               </div>
//               {!restaurant.published && (
//                 <Badge variant="secondary" className="text-xs">
//                   Unpublished
//                 </Badge>
//               )}
//             </div>
//           </div>

//           <div className="flex items-center gap-2">
//             {!previewMode && (
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => onViewModeChange(viewMode === 'grid' ? 'table' : 'grid')}
//                 className="gap-2"
//               >
//                 {viewMode === 'grid' ? (
//                   <>
//                     <Table2 className="h-4 w-4" />
//                     Table View
//                   </>
//                 ) : (
//                   <>
//                     <LayoutGrid className="h-4 w-4" />
//                     Grid View
//                   </>
//                 )}
//               </Button>
//             )}

            

//             <Button
//               variant="outline"
//               size="sm"
//               onClick={onPreviewToggle}
//               className="gap-2"
//             >
//               {previewMode ? (
//                 <>
//                   <EyeOff className="h-4 w-4" />
//                   Exit Preview
//                 </>
//               ) : (
//                 <>
//                   <Eye className="h-4 w-4" />
//                   Preview
//                 </>
//               )}
//             </Button>

//             {!previewMode && (
//               <>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={onUndo}
//                   disabled={!canUndo}
//                   className="gap-2"
//                 >
//                   <Undo2 className="h-4 w-4" />
//                   Undo
//                 </Button>

//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={onRedo}
//                   disabled={!canRedo}
//                   className="gap-2"
//                 >
//                   <Redo2 className="h-4 w-4" />
//                   Redo
//                 </Button>

//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => setShowThemeDialog(true)}
//                   className="gap-2"
//                 >
//                   <Palette className="h-4 w-4" />
//                   Theme
//                 </Button>

//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => setShowSettingsDialog(true)}
//                   className="gap-2"
//                 >
//                   <Settings className="h-4 w-4" />
//                   Settings
//                 </Button>

//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={handleQRCodeClick}
//                   className="gap-2"
//                 >
//                   <QrCode className="h-4 w-4" />
//                   QR Code
//                 </Button>

//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={handleShareClick}
//                   className="gap-2"
//                 >
//                   <Share2 className="h-4 w-4" />
//                   Share
//                 </Button>
//               </>
//             )}

//             {!previewMode && (
//               <Button
//                 variant={hasPendingChanges ? "default" : "secondary"}
//                 size="sm"
//                 onClick={handleUpdateClick}
//                 disabled={isUpdating || !hasPendingChanges}
//                 className="gap-2"
//                 title={hasPendingChanges ? "Sync changes to live menu" : "All changes synced"}
//               >
//                 {isUpdating ? (
//                   <>
//                     <RefreshCw className="h-4 w-4 animate-spin" />
//                     Updating...
//                   </>
//                 ) : hasPendingChanges ? (
//                   <>
//                     <RefreshCw className="h-4 w-4" />
//                     Update
//                   </>
//                 ) : (
//                   <>
//                     <RefreshCw className="h-4 w-4" />
//                     Update
//                   </>
//                 )}
//               </Button>
//             )}

//             <Button
//               variant={restaurant.published ? "secondary" : "default"}
//               size="sm"
//               onClick={handlePublishClick}
//               className="gap-2"
//               title={restaurant.published ? "Unpublish menu" : "Publish menu to make it live"}
//             >
//               <Upload className="h-4 w-4" />
//               {restaurant.published ? "Unpublish" : "Publish"}
//             </Button>
//           </div>
//         </div>
//       </header>

//       <QRCodeModal
//         open={showQRModal}
//         onOpenChange={setShowQRModal}
//         restaurantSlug={restaurant.slug}
//         restaurantName={restaurant.name}
//         isPublished={restaurant.published}
//       />

//       <ShareDialog
//         open={showShareDialog}
//         onOpenChange={setShowShareDialog}
//         restaurantSlug={restaurant.slug}
//         restaurantName={restaurant.name}
//         isPublished={restaurant.published}
//       />

//       <ThemeGalleryModal
//         open={showThemeDialog}
//         onOpenChange={setShowThemeDialog}
//         restaurant={restaurant}
//         onThemeChange={onThemeChange}
//       />

//       {onFilterToggle && (
//         <RestaurantSettingsDialog
//           open={showSettingsDialog}
//           onOpenChange={setShowSettingsDialog}
//           restaurant={restaurant}
//           onFilterToggle={onFilterToggle}
//           onSettingsUpdate={() => onRefresh?.()}
//         />
//       )}

//       <PaywallModal
//         open={showPaywall}
//         onOpenChange={setShowPaywall}
//         feature={paywallFeature}
//       />
//     </>
//   );
// };



import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, EyeOff, QrCode, Palette, Upload, Undo2, Redo2, LayoutGrid, Table2, Settings, Share2, RefreshCw, Check, Menu, X } from "lucide-react";
import { QRCodeModal } from "@/components/editor/QRCodeModal";
import { ShareDialog } from "@/components/editor/ShareDialog";
import { ThemeGalleryModal } from "@/components/editor/ThemeGalleryModal";
import { PaywallModal } from "@/components/PaywallModal";
import { RestaurantSettingsDialog } from "@/components/editor/RestaurantSettingsDialog";
import { useSubscription } from "@/hooks/useSubscription";
import type { Restaurant } from "@/hooks/useRestaurants";
import { Theme } from "@/lib/types/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  hasPendingChanges?: boolean;
  onImportData?: (data: any[]) => void;
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
  hasPendingChanges = false,
  onImportData,
}: EditorTopBarProps) => {
  const navigate = useNavigate();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { hasPremium } = useSubscription();

  const handleUpdateClick = async () => {
    if (!onUpdate) return;
    
    setIsUpdating(true);
    try {
      await onUpdate();
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
    setShowMobileMenu(false);
  };

  const handlePublishClick = () => {
    if (hasPremium || restaurant.published) {
      onPublishToggle();
      if (!restaurant.published) {
        setTimeout(() => setShowShareDialog(true), 500);
      }
    } else {
      setPaywallFeature("Menu Publishing");
      setShowPaywall(true);
    }
    setShowMobileMenu(false);
  };

  const handleShareClick = () => {
    if (hasPremium) {
      setShowShareDialog(true);
    } else {
      setPaywallFeature("Menu Sharing");
      setShowPaywall(true);
    }
    setShowMobileMenu(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          {/* Mobile Layout */}
          <div className="flex lg:hidden items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="p-2 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-sm sm:text-base font-bold truncate min-w-0 flex-1 leading-none">{restaurant.name}</h1>
              {!restaurant.published && (
                <Badge variant="secondary" className="text-xs shrink-0 leading-none">
                  Unpublished
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Primary Actions - Always Visible */}
              <Button
                variant={restaurant.published ? "secondary" : "default"}
                size="sm"
                onClick={handlePublishClick}
                className="gap-1.5 text-xs h-8"
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">{restaurant.published ? "Unpublish" : "Publish"}</span>
              </Button>

              {/* Mobile Menu Sheet */}
              <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="p-2">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0 flex flex-col">
                  <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle>Menu Editor</SheetTitle>
                  </SheetHeader>
                  
                  <ScrollArea className="flex-1 px-6">
                    <div className="py-4 flex flex-col gap-2">
                      {/* View Controls */}
                      <div className="pb-3 border-b">
                        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">VIEW</p>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-2"
                          onClick={() => {
                            onPreviewToggle();
                            setShowMobileMenu(false);
                          }}
                        >
                          {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {previewMode ? "Exit Preview" : "Preview Menu"}
                        </Button>
                      </div>

                      {/* Edit Controls */}
                      {!previewMode && (
                        <div className="pb-3 border-b">
                          <p className="text-xs font-medium text-muted-foreground mb-2 px-2">EDIT</p>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2"
                            onClick={() => {
                              onUndo?.();
                              setShowMobileMenu(false);
                            }}
                            disabled={!canUndo}
                          >
                            <Undo2 className="h-4 w-4" />
                            Undo
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2"
                            onClick={() => {
                              onRedo?.();
                              setShowMobileMenu(false);
                            }}
                            disabled={!canRedo}
                          >
                            <Redo2 className="h-4 w-4" />
                            Redo
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2"
                            onClick={handleUpdateClick}
                            disabled={isUpdating || !hasPendingChanges}
                          >
                            <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
                            {isUpdating ? "Updating..." : hasPendingChanges ? "Update Menu" : "All Synced"}
                          </Button>
                        </div>
                      )}

                      {/* Customization */}
                      {!previewMode && (
                        <div className="pb-3 border-b">
                          <p className="text-xs font-medium text-muted-foreground mb-2 px-2">CUSTOMIZE</p>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2"
                            onClick={() => {
                              setShowThemeDialog(true);
                              setShowMobileMenu(false);
                            }}
                          >
                            <Palette className="h-4 w-4" />
                            Theme
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2"
                            onClick={() => {
                              setShowSettingsDialog(true);
                              setShowMobileMenu(false);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                            Settings
                          </Button>
                        </div>
                      )}

                      {/* Share & Export */}
                      {!previewMode && (
                        <div className="pb-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2 px-2">SHARE</p>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2"
                            onClick={handleShareClick}
                          >
                            <Share2 className="h-4 w-4" />
                            Share Menu
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2"
                            onClick={handleQRCodeClick}
                          >
                            <QrCode className="h-4 w-4" />
                            QR Code
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Desktop Layout - UNCHANGED */}
          <div className="hidden lg:flex items-center justify-between gap-4">
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
                <h1 className="text-lg font-bold leading-none">{restaurant.name}</h1>
                {!restaurant.published && (
                  <Badge variant="secondary" className="text-xs leading-none">
                    Unpublished
                  </Badge>
                )}
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
                  variant={hasPendingChanges ? "default" : "secondary"}
                  size="sm"
                  onClick={handleUpdateClick}
                  disabled={isUpdating || !hasPendingChanges}
                  className="gap-2"
                  title={hasPendingChanges ? "Sync changes to live menu" : "All changes synced"}
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Updating...
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
          onImportData={onImportData}
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