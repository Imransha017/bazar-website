
CREATE OR REPLACE FUNCTION public.place_order(_payload jsonb)
 RETURNS TABLE(id uuid, order_number text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
  new_num text;
  uid uuid := auth.uid();
  it jsonb;
  pid uuid;
  q int;
  initial_status text := 'pending';
  pay_status text;
  v_total numeric;
  v_paid numeric;
  old_stock int;
  ds_id uuid;
BEGIN
  IF _payload IS NULL THEN RAISE EXCEPTION 'payload required'; END IF;

  IF COALESCE(_payload->>'customer_name','') = '' OR
     COALESCE(_payload->>'customer_phone','') = '' OR
     COALESCE(_payload->>'address','') = '' THEN
    RAISE EXCEPTION 'missing required fields';
  END IF;

  IF jsonb_typeof(_payload->'items') <> 'array' OR jsonb_array_length(_payload->'items') = 0 THEN
    RAISE EXCEPTION 'items required';
  END IF;

  v_total := COALESCE((_payload->>'total')::numeric, 0);
  v_paid := COALESCE((_payload->>'paid_amount')::numeric, 0);
  pay_status := lower(COALESCE(NULLIF(_payload->>'payment_status',''), 'pending'));

  IF pay_status IN ('failed','declined','error') THEN
    initial_status := 'failed';
  ELSIF pay_status IN ('cancelled','canceled','voided') THEN
    initial_status := 'cancelled';
  ELSIF (_payload->>'payment_method' IN ('bkash','nagad','rocket')) AND (NULLIF(_payload->>'txn_id','') IS NOT NULL) THEN
    IF v_paid >= v_total AND v_total > 0 THEN
      initial_status := 'completed';
      pay_status := 'paid';
    ELSE
      initial_status := 'processing';
    END IF;
  END IF;

  -- Resolution for dropshipper_id if only code is provided
  ds_id := NULLIF(_payload->>'dropshipper_id','')::uuid;
  IF ds_id IS NULL AND NULLIF(_payload->>'dropshipper_code','') IS NOT NULL THEN
    SELECT d.id INTO ds_id FROM public.dropshippers d WHERE d.code = _payload->>'dropshipper_code' LIMIT 1;
  END IF;

  INSERT INTO public.orders (
    customer_name, customer_phone, customer_email, address, district, thana,
    items, subtotal, delivery_fee, total, payment_method, payment_type,
    txn_id, sender_phone, paid_amount, status, payment_status, notes, 
    vendor_id, user_id, dropshipper_id, dropshipper_code
  ) VALUES (
    _payload->>'customer_name', _payload->>'customer_phone',
    NULLIF(_payload->>'customer_email',''), _payload->>'address',
    NULLIF(_payload->>'district',''), NULLIF(_payload->>'thana',''),
    COALESCE(_payload->'items','[]'::jsonb),
    COALESCE((_payload->>'subtotal')::numeric, 0),
    COALESCE((_payload->>'delivery_fee')::numeric, 0),
    v_total,
    COALESCE(_payload->>'payment_method','cod'),
    NULLIF(_payload->>'payment_type',''), NULLIF(_payload->>'txn_id',''),
    NULLIF(_payload->>'sender_phone',''),
    v_paid,
    initial_status,
    pay_status,
    NULLIF(_payload->>'notes',''),
    NULLIF(_payload->>'vendor_id','')::uuid, 
    uid,
    ds_id,
    NULLIF(_payload->>'dropshipper_code','')
  )
  RETURNING orders.id, orders.order_number INTO new_id, new_num;

  -- Stock deduction ONLY if not failed/cancelled
  IF initial_status NOT IN ('failed','cancelled') THEN
    FOR it IN SELECT * FROM jsonb_array_elements(_payload->'items') LOOP
      pid := NULLIF(it->>'id','')::uuid;
      q := GREATEST(COALESCE((it->>'qty')::int, 1), 1);
      IF pid IS NOT NULL THEN
        SELECT stock INTO old_stock FROM public.products WHERE id = pid;
        
        UPDATE public.products p
           SET stock = GREATEST(p.stock - q, 0)
         WHERE p.id = pid AND p.stock < 999999 AND p.stock > 0;
         
        INSERT INTO public.stock_logs (product_id, order_id, change_amount, previous_stock, new_stock, reason)
        VALUES (pid, new_id, -q, old_stock, GREATEST(old_stock - q, 0), 'order_placed');
      END IF;
    END LOOP;
  END IF;

  place_order.id := new_id;
  place_order.order_number := new_num;
  RETURN NEXT;
END;
$function$;

-- Update RLS and Grants
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' AND policyname = 'Dropshipper view own orders'
    ) THEN
        CREATE POLICY "Dropshipper view own orders" ON public.orders
        FOR SELECT TO authenticated
        USING (dropshipper_id = (SELECT id FROM public.dropshippers WHERE user_id = auth.uid() LIMIT 1));
    END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.dropshipper_earnings TO authenticated;
GRANT ALL ON public.dropshipper_earnings TO service_role;
