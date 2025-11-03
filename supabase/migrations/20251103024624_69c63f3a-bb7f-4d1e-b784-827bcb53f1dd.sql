-- Add show_allergen_filter column to restaurants table
ALTER TABLE restaurants 
ADD COLUMN show_allergen_filter BOOLEAN DEFAULT TRUE;