
-- 1. Create robust place_order function with server-side validation
CREATE OR REPLACE FUNCTION public.place_order(_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product_id uuid;
  v_qty int;
  v_price decimal;
  v_subtotal decimal := 0;
  v_shipping_fee decimal;
  v_total decimal;
  v_actual_price decimal;
  v_stock int;
  v_user_id uuid;
BEGIN
  -- Get current user ID if authenticated
  v_user_id := auth.uid();

  -- Basic validation of payload structure
  IF _payload->>'items' IS NULL OR jsonb_array_length(_payload->'items') = 0 THEN
    RAISE EXCEPTION 'Order items are required';
  END IF;

  -- 1. Validate Prices and Stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(_payload->'items')
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;
    v_price := (v_item->>'price')::decimal;

    -- Get actual product data
    SELECT price, stock INTO v_actual_price, v_stock
    FROM public.products
    WHERE id = v_product_id AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found or inactive', v_product_id;
    END IF;

    -- Check stock
    IF v_stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
    END IF;

    -- Verify price hasn't been tampered with
    IF ABS(v_actual_price - v_price) > 0.01 THEN
      RAISE EXCEPTION 'Price mismatch for product %', v_product_id;
    END IF;

    v_subtotal := v_subtotal + (v_price * v_qty);
  END LOOP;

  -- 2. Validate Totals
  v_shipping_fee := (_payload->>'delivery_fee')::decimal;
  v_total := v_subtotal + v_shipping_fee - COALESCE((_payload->>'discount')::decimal, 0);

  IF ABS(v_total - (_payload->>'total')::decimal) > 0.01 THEN
    RAISE EXCEPTION 'Order total mismatch: computed %, received %', v_total, (_payload->>'total')::decimal;
  END IF;

  -- 3. Insert Order
  v_order_number := 'ORD-' || floor(random() * 10000000)::text;
  
  INSERT INTO public.orders (
    order_number,
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    address,
    district,
    thana,
    subtotal,
    delivery_fee,
    total,
    payment_method,
    payment_type,
    txn_id,
    sender_phone,
    status,
    notes,
    vendor_id,
    dropshipper_id,
    dropshipper_code
  ) VALUES (
    v_order_number,
    v_user_id,
    _payload->>'customer_name',
    _payload->>'customer_phone',
    _payload->>'customer_email',
    _payload->>'address',
    _payload->>'district',
    _payload->>'thana',
    v_subtotal,
    v_shipping_fee,
    v_total,
    _payload->>'payment_method',
    _payload->>'payment_type',
    _payload->>'txn_id',
    _payload->>'sender_phone',
    'Pending',
    _payload->>'notes',
    (_payload->>'vendor_id')::uuid,
    (_payload->>'dropshipper_id')::uuid,
    _payload->>'dropshipper_code'
  ) RETURNING id INTO v_order_id;

  -- 4. Insert Order Items and Update Stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(_payload->'items')
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      name,
      price,
      qty,
      image,
      sku,
      size,
      color,
      variant
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_item->>'name',
      (v_item->>'price')::decimal,
      (v_item->>'qty')::int,
      v_item->>'image',
      v_item->>'sku',
      v_item->>'size',
      v_item->>'color',
      v_item->>'variant'
    );

    UPDATE public.products
    SET stock = stock - (v_item->>'qty')::int,
        sold_count = sold_count + (v_item->>'qty')::int
    WHERE id = (v_item->>'product_id')::uuid;
  END LOOP;

  -- 5. Audit log
  PERFORM public.log_order_event(
    v_order_id,
    'order_placed',
    'Order successfully placed and validated server-side',
    _payload,
    'info'
  );

  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number
  );
END;
$$;
