
-- Drop weak storage policies that allow any authenticated user to modify/delete
DROP POLICY IF EXISTS "Users can update their own dish images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own dish images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own hero images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own hero images" ON storage.objects;

-- Create ownership-based UPDATE policy for restaurant images
CREATE POLICY "Owners can update their restaurant images"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('dish-images', 'hero-images') AND
  auth.uid() IN (
    SELECT owner_id FROM public.restaurants 
    WHERE id::text = split_part(name, '/', 1)
  )
);

-- Create ownership-based DELETE policy for restaurant images
CREATE POLICY "Owners can delete their restaurant images"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('dish-images', 'hero-images') AND
  auth.uid() IN (
    SELECT owner_id FROM public.restaurants
    WHERE id::text = split_part(name, '/', 1)
  )
);
