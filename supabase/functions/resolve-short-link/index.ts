import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const isGet = req.method === 'GET';

    // Support both GET query params and POST JSON body
    const restaurantHash = isGet
      ? url.searchParams.get('restaurant_hash')
      : (await req.json().catch(() => ({}))).restaurant_hash;
    const menuId = isGet
      ? url.searchParams.get('menu_id')
      : (await req.json().catch(() => ({}))).menu_id;

    console.log('[resolve-short-link] Incoming:', { restaurantHash, menuId, method: req.method });

    if (!restaurantHash || !menuId) {
      return new Response(
        JSON.stringify({ error: 'Missing parameters', required: ['restaurant_hash', 'menu_id'] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const cleanHash = String(restaurantHash).trim().toLowerCase();
    const cleanId = String(menuId).trim();

    if (!/^([a-f0-9]{6,12})$/.test(cleanHash) || !/^\d{3,8}$/.test(cleanId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid parameter format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase with SERVICE ROLE to bypass RLS safely on the server
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[resolve-short-link] Missing env vars');
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1) Find active menu link
    const { data: link, error: linkError } = await supabase
      .from('menu_links')
      .select('restaurant_id, active')
      .eq('restaurant_hash', cleanHash)
      .eq('menu_id', cleanId)
      .eq('active', true)
      .maybeSingle();

    if (linkError) {
      console.error('[resolve-short-link] DB error reading menu_links:', linkError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!link) {
      console.log('[resolve-short-link] Link not found');
      return new Response(
        JSON.stringify({ error: 'Link not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2) Fetch restaurant to get slug and published
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('slug, published')
      .eq('id', link.restaurant_id)
      .maybeSingle();

    if (restError) {
      console.error('[resolve-short-link] DB error reading restaurant:', restError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!restaurant) {
      console.log('[resolve-short-link] Restaurant not found');
      return new Response(
        JSON.stringify({ error: 'Restaurant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!restaurant.published) {
      console.log('[resolve-short-link] Restaurant not published');
      return new Response(
        JSON.stringify({ error: 'Menu not published' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const publicSiteUrl = Deno.env.get('VITE_PUBLIC_SITE_URL') || supabaseUrl.replace('//', '//menutap.');
    const canonicalUrl = `${publicSiteUrl}/menu/${restaurant.slug}`;

    console.log('[resolve-short-link] Resolved to slug:', restaurant.slug);

    // Success response with slug so client can render without redirect
    return new Response(
      JSON.stringify({ slug: restaurant.slug, canonicalUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[resolve-short-link] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
