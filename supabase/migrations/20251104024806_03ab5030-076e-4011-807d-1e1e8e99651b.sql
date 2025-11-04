-- Fix RLS policy for subcategories to allow INSERT operations
-- The existing "Owners can manage subcategories" policy only has USING expression
-- which doesn't apply to INSERT. We need WITH CHECK for INSERT.

CREATE POLICY "Authenticated users can insert subcategories for owned categories"
ON public.subcategories
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.categories c
    JOIN public.restaurants r ON r.id = c.restaurant_id
    WHERE c.id = subcategories.category_id 
    AND r.owner_id = auth.uid()
  )
);