-- Update batch_update_order_indexes to support dish_options and dish_modifiers tables
CREATE OR REPLACE FUNCTION public.batch_update_order_indexes(table_name text, updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  item JSONB;
BEGIN
  IF table_name NOT IN ('categories', 'subcategories', 'dishes', 'dish_options', 'dish_modifiers') THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    EXECUTE format(
      'UPDATE %I SET order_index = $1 WHERE id = $2',
      table_name
    ) USING (item->>'order_index')::INTEGER, (item->>'id')::UUID;
  END LOOP;
END;
$function$;