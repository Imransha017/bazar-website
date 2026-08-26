-- Update place_order to include logging
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
  v_log_msg text;
  v_log_meta jsonb;
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

  -- Initial Log: Order Placed
  v_log_msg := format('Order %s placed by %s.', new_order.order_number, new_order.customer_name);
  v_log_meta := jsonb_build_object(
    'customer', new_order.customer_name,
    'vendor_id', v_vendor_id,
    'dropshipper_id', v_dropshipper_id,
    'dropshipper_code', new_order.dropshipper_code,
    'total', new_order.total
  );
  PERFORM public.log_order_event(new_order.id, 'attribution', v_log_msg, v_log_meta);

  -- Auto-attribute dropshipper earnings if order is from a dropshipper store
  IF v_dropshipper_id IS NOT NULL THEN
    PERFORM public.attribute_order_to_dropshipper(
      new_order.id,
      new_order.dropshipper_code,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'product_id', (item->>'id')::uuid,
            'base_price', (item->>'price')::numeric, -- Fallback to retail if base not provided
            'retail_price', (item->>'price')::numeric,
            'qty', (item->>'qty')::int
          )
        )
        FROM jsonb_array_elements(new_order.items) AS item
      )
    );
    PERFORM public.log_order_event(
      new_order.id, 
      'attribution', 
      format('Order attributed to dropshipper %s.', new_order.dropshipper_code),
      jsonb_build_object('dropshipper_id', v_dropshipper_id, 'code', new_order.dropshipper_code)
    );
  END IF;
  
  RETURN new_order;
END;
$function$;

-- Update attribute_order_to_dropshipper to include logging
CREATE OR REPLACE FUNCTION public.attribute_order_to_dropshipper(_order_id uuid, _code text, _lines jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_ds_id uuid;
  v_line jsonb;
  v_profit numeric;
  v_order_num text;
BEGIN
  -- Get order number for logging
  SELECT order_number INTO v_order_num FROM public.orders WHERE id = _order_id;

  -- 1. Find the dropshipper by code
  SELECT id INTO v_ds_id FROM public.dropshippers WHERE code = _code;
  
  IF v_ds_id IS NULL THEN
    PERFORM public.log_order_event(
      _order_id, 
      'sync_error', 
      format('Failed to attribute order to dropshipper: code %s not found.', _code),
      jsonb_build_object('code', _code),
      'error'
    );
    RAISE EXCEPTION 'Dropshipper not found with code %', _code;
  END IF;

  -- 2. Update the main order with dropshipper_id
  UPDATE public.orders 
  SET dropshipper_id = v_ds_id,
      dropshipper_code = _code
  WHERE id = _order_id;

  -- 3. Insert earnings for each line item
  FOR v_line IN SELECT * FROM jsonb_array_elements(_lines)
  LOOP
    v_profit := (v_line->>'retail_price')::numeric - (v_line->>'base_price')::numeric;
    
    INSERT INTO public.dropshipper_earnings (
      dropshipper_id,
      order_id,
      product_id,
      base_price,
      retail_price,
      qty,
      profit,
      status
    )
    VALUES (
      v_ds_id,
      _order_id,
      (v_line->>'product_id')::uuid,
      (v_line->>'base_price')::numeric,
      (v_line->>'retail_price')::numeric,
      (v_line->>'qty')::int,
      v_profit * (v_line->>'qty')::int,
      'pending'
    );
  END LOOP;
  
  PERFORM public.log_order_event(
    _order_id, 
    'attribution', 
    format('Successfully attributed earnings to dropshipper %s.', _code),
    jsonb_build_object('dropshipper_id', v_ds_id, 'line_count', jsonb_array_length(_lines))
  );
END;
$function$;

-- Update attribute_order_to_affiliate to include logging
CREATE OR REPLACE FUNCTION public.attribute_order_to_affiliate(_order_id uuid, _code text, _product_id uuid DEFAULT NULL)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_aff_id uuid;
  v_order_total numeric;
  v_comm_pct numeric;
  v_amount numeric;
BEGIN
  -- 1. Find affiliate
  SELECT id, commission_pct INTO v_aff_id, v_comm_pct 
  FROM public.affiliates 
  WHERE code = _code AND status = 'approved';
  
  IF v_aff_id IS NULL THEN
    PERFORM public.log_order_event(
      _order_id, 
      'sync_error', 
      format('Failed to attribute order to affiliate: code %s not found or not approved.', _code),
      jsonb_build_object('code', _code),
      'warning'
    );
    RETURN;
  END IF;

  -- 2. Update order
  UPDATE public.orders 
  SET affiliate_id = v_aff_id,
      affiliate_code = _code
  WHERE id = _order_id;

  -- 3. Calculate commission (simplified for this sync)
  SELECT total INTO v_order_total FROM public.orders WHERE id = _order_id;
  
  -- Use affiliate specific pct or fallback to settings
  IF v_comm_pct IS NULL THEN
    SELECT commission_pct INTO v_comm_pct FROM public.affiliate_settings WHERE id = 1;
  END IF;
  
  v_amount := v_order_total * (v_comm_pct / 100.0);

  -- 4. Insert commission
  INSERT INTO public.affiliate_commissions (
    affiliate_id,
    order_id,
    product_id,
    order_total,
    commission_pct,
    amount,
    status
  )
  VALUES (
    v_aff_id,
    _order_id,
    _product_id,
    v_order_total,
    v_comm_pct,
    v_amount,
    'pending'
  );
  
  PERFORM public.log_order_event(
    _order_id, 
    'attribution', 
    format('Successfully attributed order to affiliate %s. Earned %s.', _code, v_amount),
    jsonb_build_object('affiliate_id', v_aff_id, 'amount', v_amount)
  );
END;
$function$;