import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PublicMenuStatic from "./PublicMenuStatic";
import { useFullMenu } from "@/hooks/useFullMenu";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Zero-delay short link resolution
 * Single-join query + full menu fetch in parallel
 */
const MenuShortDisplay = () => {
  const { restaurantHash, menuId } = useParams<{ restaurantHash: string; menuId: string }>();
  const [status, setStatus] = useState<"resolving" | "found" | "not-found" | "unpublished">("resolving");
  const [restaurantId, setRestaurantId] = useState<string>("");
  const { data: fullMenu, isLoading: menuLoading } = useFullMenu(restaurantId, { 
    useLocalStorageCache: false 
  });

  useEffect(() => {
    const resolveLink = async () => {
      if (!restaurantHash || !menuId) {
        setStatus("not-found");
        return;
      }

      try {
        // Single join query - resolve link + restaurant in one call
        const { data: link, error } = await supabase
          .from('menu_links')
          .select('restaurant_id, restaurants!inner(id, slug, published)')
          .eq('restaurant_hash', restaurantHash.trim().toLowerCase())
          .eq('menu_id', menuId.trim())
          .eq('active', true)
          .maybeSingle();

        if (error || !link) {
          setStatus('not-found');
          return;
        }

        const restaurant = (link as any).restaurants;

        if (!restaurant.published) {
          setStatus('unpublished');
          return;
        }

        // Success - kick off full menu fetch
        setRestaurantId(restaurant.id);
        setStatus('found');
      } catch {
        setStatus('not-found');
      }
    };

    resolveLink();
  }, [restaurantHash, menuId]);

  // Instant shell - no spinner, paint immediately
  if (status === "resolving" || (status === "found" && !fullMenu)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 bg-background/95 backdrop-blur-sm border-b border-border/50" />
        <div className="h-64 md:h-80 relative overflow-hidden">
          <Skeleton className="absolute inset-0" />
        </div>
        <div className="sticky top-[57px] z-40 bg-background border-b border-border">
          <div className="flex gap-3 overflow-x-auto pb-3 pt-4 px-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
            ))}
          </div>
        </div>
        <div className="px-6 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (status === "not-found") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Menu Not Found</h1>
          <p className="text-muted-foreground">This menu link is invalid or has been removed.</p>
        </div>
      </div>
    );
  }

  // Unpublished state
  if (status === "unpublished") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Menu Not Available</h1>
          <p className="text-muted-foreground">This menu hasn't been published yet.</p>
        </div>
      </div>
    );
  }

  // Render static menu with full payload
  if (status === "found" && fullMenu) {
    return (
      <PublicMenuStatic
        restaurant={fullMenu.restaurant}
        categories={fullMenu.categories || []}
      />
    );
  }

  // Fallback (should never reach here)
  return null;
};

export default MenuShortDisplay;
