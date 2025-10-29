-- Create optimized batch update function for order indexes
-- This replaces N individual UPDATE queries with a single bulk operation

CREATE OR REPLACE FUNCTION public.batch_update_order_indexes_optimized(
  table_name text,
  updates jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  query text;
BEGIN
  -- Validate table name to prevent SQL injection
  IF table_name NOT IN ('categories', 'subcategories', 'dishes') THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  -- Build and execute single UPDATE FROM query
  query := format(
    'UPDATE %I SET order_index = updates.new_order
     FROM (SELECT (value->>''id'')::uuid as id, (value->>''order_index'')::integer as new_order 
           FROM jsonb_array_elements($1)) as updates
     WHERE %I.id = updates.id',
    table_name, table_name
  );

  EXECUTE query USING updates;
END;
$$;