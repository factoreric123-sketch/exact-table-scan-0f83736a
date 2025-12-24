-- Add show_currency_symbol column to restaurants table (default true = show $)
ALTER TABLE public.restaurants 
ADD COLUMN show_currency_symbol boolean DEFAULT true;