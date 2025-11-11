-- Drop the overly permissive policy that allows authenticated users to see other users' published restaurants
DROP POLICY IF EXISTS "Public can view published restaurants" ON restaurants;

-- Create new policy: Only unauthenticated (anon) users can view published restaurants
-- This ensures authenticated users cannot see other users' restaurants, even if published
CREATE POLICY "Anonymous users can view published restaurants"
  ON restaurants
  FOR SELECT
  TO anon
  USING (published = true);

-- The existing "Owners can view their own restaurants" policy ensures authenticated users
-- can only see their own restaurants (owner_id = auth.uid())