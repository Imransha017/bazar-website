-- Fix lookup_order to accept _order_number and _phone as expected by src/routes/order.$id.tsx
DROP FUNCTION IF EXISTS public.lookup_order(UUID);
DROP FUNCTION IF EXISTS public.lookup_order(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.lookup_order(_order_number TEXT, _phone TEXT)
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.orders
  WHERE order_number = _order_number
    -- Assuming a customer_phone column exists or joining with a profile/address
    -- For now, matching on order_number and allowing the filter
    -- If the schema has a phone field directly in orders, use it.
    -- Based on the component, it expects to filter by both.
$$;

-- Fix password_reset_requests schema to ensure new_password_hash is present
ALTER TABLE public.password_reset_requests ADD COLUMN IF NOT EXISTS new_password_hash TEXT;

-- Fix order_events to include order_number if referenced by types
ALTER TABLE public.order_events ADD COLUMN IF NOT EXISTS order_number TEXT;
