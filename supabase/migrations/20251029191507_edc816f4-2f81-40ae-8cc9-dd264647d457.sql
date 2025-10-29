-- Create user_themes table for custom theme storage
CREATE TABLE user_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  theme_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster user theme lookups
CREATE INDEX idx_user_themes_user_id ON user_themes(user_id);

-- Enable Row Level Security
ALTER TABLE user_themes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own themes"
  ON user_themes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own themes"
  ON user_themes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own themes"
  ON user_themes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own themes"
  ON user_themes FOR DELETE
  USING (user_id = auth.uid());

-- Enable realtime for restaurants table (for collaborative editing)
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurants;

-- Add trigger for updated_at
CREATE TRIGGER update_user_themes_updated_at
  BEFORE UPDATE ON user_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();