CREATE OR REPLACE FUNCTION public.place_order(_payload jsonb)
 RETURNS orders
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_order public.orders;
  v_vendor_id uuid;
  v_dropshipper_id uuid;
BEGIN
  -- Handle empty/null strings for UUID conversion
  v_vendor_id := CASE 
    WHEN _payload->>'vendor_id' IS NOT NULL AND _payload->>'vendor_id' <> '' 
    THEN (_payload->>'vendor_id')::uuid 
    ELSE NULL 
  END;
  
  v_dropshipper_id := CASE 
    WHEN _payload->>'dropshipper_id' IS NOT NULL AND _payload->>'dropshipper_id' <> '' 
    THEN (_payload->>'dropshipper_id')::uuid 
    ELSE NULL 
  END;

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
    v_vendor_id,
    v_dropshipper_id,
    _payload->>'dropshipper_code',
    'pending',
    now()
  )
  RETURNING * INTO new_order;
  
  RETURN new_order;
END;
$function$;