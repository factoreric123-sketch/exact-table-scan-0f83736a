import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PublicMenu from "./PublicMenu";

/**
 * Renders menus at /m/{restaurant_hash}/{menu_id} without redirecting
 * Keeps the clean hash-based URL in the browser
 */
const MenuShortDisplay = () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('[MenuShortDisplay] COMPONENT MOUNTED');
  console.log('═══════════════════════════════════════════════════════');
  
  const { restaurantHash, menuId } = useParams<{ restaurantHash: string; menuId: string }>();
  console.log('[MenuShortDisplay] URL params:', { restaurantHash, menuId });
  
  const [status, setStatus] = useState<"loading" | "found" | "not-found" | "unpublished">("loading");
  const [restaurantSlug, setRestaurantSlug] = useState<string>("");

  useEffect(() => {
    console.log('[MenuShortDisplay] useEffect triggered');
    
    const resolveMenu = async () => {
      if (!restaurantHash || !menuId) {
        console.error('[MenuShortDisplay] Missing hash or ID!');
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
          // Resolve via secure backend function to avoid client-side RLS issues
          const { data, error } = await supabase.functions.invoke('resolve-short-link', {
            body: {
              restaurant_hash: cleanHash,
              menu_id: cleanId,
            },
          });

          if (error) {
            lastError = error;
            console.log(`[MenuShortDisplay] Attempt ${attempt + 1} function error:`, error);

            const status = (error as any)?.status;
            if (status === 403) {
              console.log('[MenuShortDisplay] Unpublished menu via resolver');
              setStatus('unpublished');
              return;
            }
            if (status === 404) {
              console.log('[MenuShortDisplay] Link not found via resolver');
              setStatus('not-found');
              return;
            }
            if (status === 400) {
              console.log('[MenuShortDisplay] Invalid parameters via resolver');
              setStatus('not-found');
              return;
            }

            // Retry with backoff if not last attempt and not a terminal error
            if (attempt < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
              continue;
            }

            setStatus('not-found');
            return;
          }

          const slug = (data as any)?.slug as string | undefined;
          if (!slug) {
            if (attempt < maxRetries - 1) {
              console.log(`[MenuShortDisplay] Resolver returned no slug, retrying (attempt ${attempt + 1})...`);
              await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
              continue;
            }
            setStatus('not-found');
            return;
          }

          // Success! Found and published
          console.log(`[MenuShortDisplay] Successfully resolved via function on attempt ${attempt + 1}`);
          setRestaurantSlug(slug);
          setStatus('found');
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
