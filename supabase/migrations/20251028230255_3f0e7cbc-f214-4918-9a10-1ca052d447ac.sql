-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin');

-- Create restaurants table
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT,
  hero_image_url TEXT,
  theme JSONB DEFAULT '{"mode": "dark", "primaryColor": "hsl(142, 76%, 36%)"}',
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subcategories table
CREATE TABLE public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create dishes table
CREATE TABLE public.dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT NOT NULL,
  image_url TEXT,
  is_new BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create security definer function to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Enable RLS on all tables
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurants
CREATE POLICY "Public can view published restaurants"
  ON public.restaurants FOR SELECT
  USING (published = true);

CREATE POLICY "Owners can view their own restaurants"
  ON public.restaurants FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert their own restaurants"
  ON public.restaurants FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their own restaurants"
  ON public.restaurants FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their own restaurants"
  ON public.restaurants FOR DELETE
  USING (owner_id = auth.uid());

-- RLS Policies for categories
CREATE POLICY "Public can view categories of published restaurants"
  ON public.categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = categories.restaurant_id
      AND restaurants.published = true
    )
  );

CREATE POLICY "Owners can view categories of their restaurants"
  ON public.categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = categories.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage categories"
  ON public.categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = categories.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- RLS Policies for subcategories
CREATE POLICY "Public can view subcategories of published restaurants"
  ON public.subcategories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.categories
      JOIN public.restaurants ON restaurants.id = categories.restaurant_id
      WHERE categories.id = subcategories.category_id
      AND restaurants.published = true
    )
  );

CREATE POLICY "Owners can view subcategories of their restaurants"
  ON public.subcategories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.categories
      JOIN public.restaurants ON restaurants.id = categories.restaurant_id
      WHERE categories.id = subcategories.category_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage subcategories"
  ON public.subcategories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.categories
      JOIN public.restaurants ON restaurants.id = categories.restaurant_id
      WHERE categories.id = subcategories.category_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- RLS Policies for dishes
CREATE POLICY "Public can view dishes of published restaurants"
  ON public.dishes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subcategories
      JOIN public.categories ON categories.id = subcategories.category_id
      JOIN public.restaurants ON restaurants.id = categories.restaurant_id
      WHERE subcategories.id = dishes.subcategory_id
      AND restaurants.published = true
    )
  );

CREATE POLICY "Owners can view dishes of their restaurants"
  ON public.dishes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subcategories
      JOIN public.categories ON categories.id = subcategories.category_id
      JOIN public.restaurants ON restaurants.id = categories.restaurant_id
      WHERE subcategories.id = dishes.subcategory_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage dishes"
  ON public.dishes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.subcategories
      JOIN public.categories ON categories.id = subcategories.category_id
      JOIN public.restaurants ON restaurants.id = categories.restaurant_id
      WHERE subcategories.id = dishes.subcategory_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dish-images', 'dish-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for dish-images
CREATE POLICY "Public can view dish images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dish-images');

CREATE POLICY "Authenticated users can upload dish images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'dish-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own dish images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'dish-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own dish images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'dish-images' AND auth.uid() IS NOT NULL);

-- Storage RLS policies for hero-images
CREATE POLICY "Public can view hero images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hero-images');

CREATE POLICY "Authenticated users can upload hero images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'hero-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own hero images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'hero-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own hero images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'hero-images' AND auth.uid() IS NOT NULL);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger for restaurants
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();