import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MenuLink {
  restaurant_hash: string;
  menu_id: string;
  active: boolean;
}

/**
 * Deterministically generates hash and menu_id from restaurant UUID
 */
async function generateLinkIds(restaurantId: string): Promise<{ restaurant_hash: string; menu_id: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(restaurantId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const fullHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const restaurant_hash = fullHex.slice(0, 8);
  const numBase = parseInt(fullHex.slice(8, 16), 16);
  const menu_num = (numBase % 100000).toString().padStart(5, '0');
  
  return { restaurant_hash, menu_id: menu_num };
}

/**
 * Verifies a menu link is publicly resolvable via RLS policies
 */
async function verifyLinkResolvable(
  supabaseAnon: any,
  restaurant_hash: string,
  menu_id: string,
  maxRetries: number = 5
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Query as public user would (using anon key)
      const { data, error } = await supabaseAnon
        .from('menu_links')
        .select('restaurant_id, active')
        .eq('restaurant_hash', restaurant_hash)
        .eq('menu_id', menu_id)
        .eq('active', true)
        .maybeSingle();

      if (error) {
        console.log(`[ensure-menu-link] Verification attempt ${attempt + 1} error:`, error);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
          continue;
        }
        return false;
      }

      if (data && data.active) {
        // Also verify the restaurant is published and accessible
        const { data: restaurant, error: restError } = await supabaseAnon
          .from('restaurants')
          .select('id, slug, published')
          .eq('id', data.restaurant_id)
          .maybeSingle();

        if (restError || !restaurant || !restaurant.published) {
          console.log(`[ensure-menu-link] Restaurant not accessible:`, restError, restaurant);
          return false;
        }

        console.log(`[ensure-menu-link] Link verified successfully on attempt ${attempt + 1}`);
        return true;
      }
    } catch (err) {
      console.log(`[ensure-menu-link] Verification attempt ${attempt + 1} exception:`, err);
    }

    if (attempt < maxRetries - 1) {
      // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
    }
  }

  return false;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user's supabase client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Authenticated client for writes
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Anonymous client for verification
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

    // Parse request body
    const { restaurant_id } = await req.json();

    if (!restaurant_id) {
      return new Response(
        JSON.stringify({ error: 'Missing restaurant_id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ensure-menu-link] Processing request for restaurant:', restaurant_id);

    // Step 1: Verify restaurant exists and user has access
    const { data: restaurant, error: restaurantError } = await supabaseAuth
      .from('restaurants')
      .select('id, slug, published, owner_id')
      .eq('id', restaurant_id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      console.error('[ensure-menu-link] Restaurant not found or access denied:', restaurantError);
      return new Response(
        JSON.stringify({ error: 'Restaurant not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Check if link already exists
    const { data: existingLink, error: existingError } = await supabaseAuth
      .from('menu_links')
      .select('restaurant_hash, menu_id, active')
      .eq('restaurant_id', restaurant_id)
      .eq('active', true)
      .maybeSingle();

    let linkData: MenuLink;

    if (existingLink && !existingError) {
      console.log('[ensure-menu-link] Found existing link:', existingLink);
      linkData = existingLink;
    } else {
      // Step 3: Generate deterministic IDs
      const { restaurant_hash, menu_id } = await generateLinkIds(restaurant_id);

      console.log('[ensure-menu-link] Creating new link:', { restaurant_hash, menu_id });

      // Step 4: Create link (upsert for idempotency)
      const { data: newLink, error: insertError } = await supabaseAuth
        .from('menu_links')
        .upsert(
          {
            restaurant_id,
            restaurant_hash,
            menu_id,
            active: true,
          },
          { onConflict: 'restaurant_id' }
        )
        .select('restaurant_hash, menu_id, active')
        .single();

      if (insertError || !newLink) {
        console.error('[ensure-menu-link] Failed to create link:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create menu link', details: insertError?.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      linkData = newLink;
      console.log('[ensure-menu-link] Link created:', linkData);
    }

    // Step 5: CRITICAL - Verify link is publicly resolvable before returning
    // This ensures no timing issues when user immediately clicks the link
    console.log('[ensure-menu-link] Verifying link is publicly accessible...');
    const isResolvable = await verifyLinkResolvable(
      supabaseAnon,
      linkData.restaurant_hash,
      linkData.menu_id
    );

    if (!isResolvable) {
      console.error('[ensure-menu-link] Link created but not resolvable!');
      return new Response(
        JSON.stringify({ 
          error: 'Link created but not immediately accessible. Please ensure your restaurant is published.',
          details: 'The menu link was created but failed verification. This usually means the restaurant is not published or there are permission issues.'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ensure-menu-link] Link verified and ready!');

    // Step 6: Return verified link
    const publicSiteUrl = Deno.env.get('VITE_PUBLIC_SITE_URL') || supabaseUrl.replace('//', '//menutap.');
    const fullUrl = `${publicSiteUrl}/m/${linkData.restaurant_hash}/${linkData.menu_id}`;

    return new Response(
      JSON.stringify({
        success: true,
        restaurant_hash: linkData.restaurant_hash,
        menu_id: linkData.menu_id,
        url: fullUrl,
        verified: true,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[ensure-menu-link] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
