import { memo } from "react";
import { Loader2 } from "lucide-react";
import DishCard, { Dish } from "./DishCard";
import { useSyncState } from "@/hooks/useSyncState";

interface DishCardWithSyncProps {
  dish: Dish;
  onClick?: () => void;
  showPrice?: boolean;
  showImage?: boolean;
  imageSize?: 'compact' | 'large';
  fontSize?: 'small' | 'medium' | 'large';
  forceTwoDecimals?: boolean;
  showCurrencySymbol?: boolean;
  layoutStyle?: 'generic' | 'fancy';
  badgeColors?: {
    new_addition: string;
    special: string;
    popular: string;
    chef_recommendation: string;
  };
  cardImageShape?: 'square' | 'vertical';
  textOverlay?: boolean;
  menuFont?: string;
}

/**
 * DishCard wrapper that shows loading state when the dish is syncing
 * Ensures users never see false/incomplete data - only accurate data or loading state
 */
const DishCardWithSync = memo(({ 
  dish, 
  ...props 
}: DishCardWithSyncProps) => {
  const { isDishSyncing, isImageSyncing } = useSyncState();
  const isSyncing = isDishSyncing(dish.id);
  const isImageLoading = isImageSyncing(dish.id);

  // If dish is syncing, show overlay with spinner
  if (isSyncing) {
    return (
      <div className="relative">
        <DishCard dish={dish} {...props} />
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Syncing...</span>
          </div>
        </div>
      </div>
    );
  }

  // If only image is syncing, show small spinner on image area
  return (
    <div className="relative">
      <DishCard dish={dish} {...props} />
      {isImageLoading && (
        <div className="absolute top-2 left-2 bg-black/60 rounded-full p-1.5 z-10">
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        </div>
      )}
    </div>
  );
});

DishCardWithSync.displayName = 'DishCardWithSync';

export default DishCardWithSync;
