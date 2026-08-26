-- Drop and recreate place_order to fix return type and ensure security definer
DROP FUNCTION IF EXISTS public.place_order(jsonb);

CREATE OR REPLACE FUNCTION public.place_order(_payload jsonb)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_order public.orders;
BEGIN
  INSERT INTO public.orders (
    customer_name, customer_phone, address, district, thana,
    items, subtotal, delivery_fee, total, payment_method,
    payment_type, txn_id, sender_phone, paid_amount,
    vendor_id, dropshipper_id, dropshipper_code, status, created_at
  )
  VALUES (
    _payload->>'customer_name',
    _payload->>'customer_phone',
    _payload->>'address',
    _payload->>'district',
    _payload->>'thana',
    (_payload->>'items')::jsonb,
    (_payload->>'subtotal')::numeric,
    (_payload->>'delivery_fee')::numeric,
    (_payload->>'total')::numeric,
    _payload->>'payment_method',
    _payload->>'payment_type',
    _payload->>'txn_id',
    _payload->>'sender_phone',
    (_payload->>'paid_amount')::numeric,
    (_payload->>'vendor_id')::uuid,
    (_payload->>'dropshipper_id')::uuid,
    _payload->>'dropshipper_code',
    'pending',
    now()
  )
  RETURNING * INTO new_order;
  
  RETURN new_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(jsonb) TO anon, authenticated;

-- Policies
DROP POLICY IF EXISTS "Dropshipper view own orders" ON public.orders;
CREATE POLICY "Dropshipper view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Vendor reads own orders" ON public.orders;
CREATE POLICY "Vendor reads own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  OR 
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(items) AS it
    WHERE (it->>'vendor_id')::uuid IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  )
);
