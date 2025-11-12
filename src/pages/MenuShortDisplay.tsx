import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PublicMenu from "./PublicMenu";

/**
 * Instant menu loading via direct database queries
 * No edge functions, no retries, pure speed
 */
const MenuShortDisplay = () => {
  const { restaurantHash, menuId } = useParams<{ restaurantHash: string; menuId: string }>();
  const [status, setStatus] = useState<"loading" | "found" | "not-found" | "unpublished">("loading");
  const [restaurantSlug, setRestaurantSlug] = useState<string>("");

  useEffect(() => {
    const resolveMenu = async () => {
      if (!restaurantHash || !menuId) {
        setStatus("not-found");
        return;
      }

      const cleanHash = restaurantHash.trim().toLowerCase();
      const cleanId = menuId.trim();

      try {
        // Direct database query - no edge function, instant resolution
        const { data: link, error: linkError } = await supabase
          .from('menu_links')
          .select('restaurant_id')
          .eq('restaurant_hash', cleanHash)
          .eq('menu_id', cleanId)
          .eq('active', true)
          .maybeSingle();

        if (linkError || !link) {
          setStatus('not-found');
          return;
        }

        // Get restaurant slug and published status
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('slug, published')
          .eq('id', link.restaurant_id)
          .maybeSingle();

        if (restaurantError || !restaurant) {
          setStatus('not-found');
          return;
        }

        if (!restaurant.published) {
          setStatus('unpublished');
          return;
        }

        // Success - instant resolution
        setRestaurantSlug(restaurant.slug);
        setStatus('found');
      } catch (err) {
        setStatus('not-found');
      }
    };

    resolveMenu();
  }, [restaurantHash, menuId]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading menu...</p>
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

  // Render the actual menu (found state)
  // We pass the slug as a URL param override to PublicMenu
  return <PublicMenu slugOverride={restaurantSlug} />;
};

export default MenuShortDisplay;
