import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PublicMenu from "./PublicMenu";

/**
 * Renders menus at /m/{restaurant_hash}/{menu_id} without redirecting
 * Keeps the clean hash-based URL in the browser
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

      // Clean the inputs
      const cleanHash = restaurantHash.trim().toLowerCase();
      const cleanId = menuId.trim();

      // Retry logic with exponential backoff for resilience against replication lag
      const maxRetries = 5;
      let lastError: any = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Look up the menu_links entry
          const { data: linkData, error: linkError } = await supabase
            .from("menu_links")
            .select("restaurant_id")
            .eq("restaurant_hash", cleanHash)
            .eq("menu_id", cleanId)
            .eq("active", true)
            .maybeSingle();

          if (linkError) {
            lastError = linkError;
            console.log(`[MenuShortDisplay] Attempt ${attempt + 1} link query error:`, linkError);
            
            // Retry with backoff if not last attempt
            if (attempt < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
              continue;
            }
            setStatus("not-found");
            return;
          }

          if (!linkData) {
            // Link not found - retry with backoff for potential replication lag
            if (attempt < maxRetries - 1) {
              console.log(`[MenuShortDisplay] Attempt ${attempt + 1} link not found, retrying...`);
              await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
              continue;
            }
            console.log("[MenuShortDisplay] Link not found after all retries");
            setStatus("not-found");
            return;
          }

          // Get the restaurant slug and published status
          const { data: restaurant, error: restaurantError } = await supabase
            .from("restaurants")
            .select("slug, published")
            .eq("id", linkData.restaurant_id)
            .maybeSingle();

          if (restaurantError) {
            lastError = restaurantError;
            console.log(`[MenuShortDisplay] Attempt ${attempt + 1} restaurant query error:`, restaurantError);
            
            if (attempt < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
              continue;
            }
            setStatus("not-found");
            return;
          }

          if (!restaurant) {
            if (attempt < maxRetries - 1) {
              console.log(`[MenuShortDisplay] Attempt ${attempt + 1} restaurant not found, retrying...`);
              await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
              continue;
            }
            console.log("[MenuShortDisplay] Restaurant not found after all retries");
            setStatus("not-found");
            return;
          }

          if (!restaurant.published) {
            // If unpublished, no need to retry
            console.log("[MenuShortDisplay] Restaurant not published");
            setStatus("unpublished");
            return;
          }

          // Success! Found it and it's published
          console.log(`[MenuShortDisplay] Successfully resolved on attempt ${attempt + 1}`);
          setRestaurantSlug(restaurant.slug);
          setStatus("found");
          return;

        } catch (err) {
          lastError = err;
          console.error(`[MenuShortDisplay] Attempt ${attempt + 1} exception:`, err);
          
          // Retry with backoff if not last attempt
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
            continue;
          }
        }
      }

      // If we get here, all retries failed
      console.error("[MenuShortDisplay] All retry attempts failed:", lastError);
      setStatus("not-found");
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
