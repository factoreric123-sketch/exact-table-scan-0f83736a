-- Fix RLS policies for menu_links to allow owners to create links
-- Drop existing policies
DROP POLICY IF EXISTS "Owners can manage their menu_links" ON public.menu_links;
DROP POLICY IF EXISTS "Public can view active menu_links for published restaurants" ON public.menu_links;

-- Create new policies that properly check restaurant ownership
-- Allow owners to INSERT menu links for their restaurants
CREATE POLICY "Owners can insert menu_links for their restaurants"
ON public.menu_links
FOR INSERT
TO authenticated
WITH CHECK (
  restaurant_id IN (
    SELECT id FROM public.restaurants
    WHERE owner_id = auth.uid()
  )
);

-- Allow owners to UPDATE their menu links
CREATE POLICY "Owners can update their menu_links"
ON public.menu_links
FOR UPDATE
TO authenticated
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants
    WHERE owner_id = auth.uid()
  )
);

-- Allow owners to SELECT their menu links
CREATE POLICY "Owners can view their menu_links"
ON public.menu_links
FOR SELECT
TO authenticated
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants
    WHERE owner_id = auth.uid()
  )
);

-- Allow owners to DELETE their menu links
CREATE POLICY "Owners can delete their menu_links"
ON public.menu_links
FOR DELETE
TO authenticated
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants
    WHERE owner_id = auth.uid()
  )
);

-- Allow public to view active menu links for published restaurants
CREATE POLICY "Public can view active menu_links for published restaurants"
ON public.menu_links
FOR SELECT
TO public
USING (
  active = true
  AND restaurant_id IN (
    SELECT id FROM public.restaurants
    WHERE published = true
  )
);