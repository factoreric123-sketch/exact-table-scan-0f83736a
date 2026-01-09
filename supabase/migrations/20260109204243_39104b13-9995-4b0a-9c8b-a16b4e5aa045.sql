ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS card_image_shape text DEFAULT 'square',
ADD COLUMN IF NOT EXISTS text_overlay boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS menu_font text DEFAULT 'Inter';