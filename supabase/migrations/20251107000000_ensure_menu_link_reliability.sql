-- Migration to ensure menu link creation is reliable and atomic
-- Adds database-level functions and constraints to prevent broken links

-- 1) Add a database function to atomically create and verify menu links
CREATE OR REPLACE FUNCTION public.ensure_menu_link_for_restaurant(
  p_restaurant_id uuid
)
RETURNS TABLE (
  restaurant_hash text,
  menu_id text,
  url text,
  is_accessible boolean
) AS $$
DECLARE
  v_hash text;
  v_menu_id text;
  v_full_hex text;
  v_num_base bigint;
  v_restaurant_published boolean;
  v_link_exists boolean;
BEGIN
  -- Check if restaurant exists and is owned by current user
  SELECT published INTO v_restaurant_published
  FROM public.restaurants
  WHERE id = p_restaurant_id AND owner_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Restaurant not found or access denied';
  END IF;

  -- Check if link already exists
  SELECT true, ml.restaurant_hash, ml.menu_id
  INTO v_link_exists, v_hash, v_menu_id
  FROM public.menu_links ml
  WHERE ml.restaurant_id = p_restaurant_id AND ml.active = true
  LIMIT 1;

  -- If link doesn't exist, create it
  IF NOT v_link_exists THEN
    -- Generate deterministic hash from restaurant ID (SHA-256)
    v_full_hex := encode(digest(p_restaurant_id::text, 'sha256'), 'hex');
    v_hash := substring(v_full_hex, 1, 8);
    
    -- Generate deterministic menu_id
    v_num_base := ('x' || substring(v_full_hex, 9, 8))::bit(32)::bigint;
    v_menu_id := lpad((v_num_base % 100000)::text, 5, '0');

    -- Insert the link (will fail if duplicate due to unique constraints)
    INSERT INTO public.menu_links (restaurant_id, restaurant_hash, menu_id, active)
    VALUES (p_restaurant_id, v_hash, v_menu_id, true)
    ON CONFLICT (restaurant_id) DO UPDATE
    SET active = true, updated_at = now()
    RETURNING menu_links.restaurant_hash, menu_links.menu_id
    INTO v_hash, v_menu_id;
  END IF;

  -- Verify the link is accessible (simulates public RLS check)
  -- A link is accessible if it's active AND restaurant is published
  RETURN QUERY
  SELECT 
    v_hash as restaurant_hash,
    v_menu_id as menu_id,
    '/m/' || v_hash || '/' || v_menu_id as url,
    v_restaurant_published as is_accessible;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_menu_link_for_restaurant(uuid) TO authenticated;

-- 2) Add comment explaining the function
COMMENT ON FUNCTION public.ensure_menu_link_for_restaurant(uuid) IS 
'Atomically creates or retrieves a menu link for a restaurant and verifies it is accessible. Returns link details and accessibility status.';

-- 3) Add an index for faster lookups on active links
CREATE INDEX IF NOT EXISTS idx_menu_links_active_restaurant 
ON public.menu_links(restaurant_id, active) 
WHERE active = true;

-- 4) Add a check constraint to ensure restaurant_hash format is valid
ALTER TABLE public.menu_links 
ADD CONSTRAINT chk_menu_links_hash_format 
CHECK (restaurant_hash ~ '^[0-9a-f]{8}$');

-- 5) Add a check constraint to ensure menu_id format is valid
ALTER TABLE public.menu_links 
ADD CONSTRAINT chk_menu_links_menu_id_format 
CHECK (menu_id ~ '^[0-9]{5}$');

-- 6) Add a function to validate menu link accessibility (for monitoring)
CREATE OR REPLACE FUNCTION public.verify_menu_link_accessible(
  p_restaurant_hash text,
  p_menu_id text
)
RETURNS boolean AS $$
DECLARE
  v_accessible boolean;
BEGIN
  -- Check if link exists, is active, and restaurant is published
  SELECT EXISTS (
    SELECT 1
    FROM public.menu_links ml
    INNER JOIN public.restaurants r ON r.id = ml.restaurant_id
    WHERE ml.restaurant_hash = p_restaurant_hash
      AND ml.menu_id = p_menu_id
      AND ml.active = true
      AND r.published = true
  ) INTO v_accessible;
  
  RETURN v_accessible;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon for public verification
GRANT EXECUTE ON FUNCTION public.verify_menu_link_accessible(text, text) TO anon, authenticated;

COMMENT ON FUNCTION public.verify_menu_link_accessible(text, text) IS 
'Verifies if a menu link is publicly accessible (active link + published restaurant).';
