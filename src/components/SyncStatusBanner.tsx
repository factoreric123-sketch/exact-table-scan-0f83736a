import { memo } from "react";
import { Loader2 } from "lucide-react";
import { useSyncState } from "@/hooks/useSyncState";

/**
 * Global sync status banner shown at top of Preview/Live Menu
 * Displays when any data is actively syncing to ensure user awareness
 */
const SyncStatusBanner = memo(() => {
  const { hasAnySyncing } = useSyncState();

  if (!hasAnySyncing()) return null;

  return (
    <div className="sticky top-0 left-0 right-0 z-50 bg-amber-500/95 text-white py-2 px-4 text-center text-sm flex items-center justify-center gap-2 shadow-md">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="font-medium">Syncing changes...</span>
    </div>
  );
});

SyncStatusBanner.displayName = 'SyncStatusBanner';

export default SyncStatusBanner;
