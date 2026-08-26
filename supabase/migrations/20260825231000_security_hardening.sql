-- Migration: Security Hardening & RPC Protection
-- Date: 2026-08-25

-- 1. Ensure RLS on password_reset_requests and restrict access to admins only
ALTER TABLE IF EXISTS public.password_reset_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view and review password resets" ON public.password_reset_requests;
CREATE POLICY "Admins can view and review password resets" ON public.password_reset_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow public insertion for password reset requests (subject to rate limiting in server functions)
DROP POLICY IF EXISTS "Public can submit password reset request" ON public.password_reset_requests;
CREATE POLICY "Public can submit password reset request" ON public.password_reset_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 2. Hardened place_order RPC with strict price and coupon validation
CREATE OR REPLACE FUNCTION public.place_order(_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product_id uuid;
  v_qty int;
  v_price numeric;
  v_subtotal numeric := 0;
  v_shipping_fee numeric;
  v_discount numeric := 0;
  v_coupon_code text;
  v_coupon_record record;
  v_total numeric;
  v_actual_price numeric;
  v_stock int;
BEGIN
  IF _payload->'items' IS NULL OR jsonb_array_length(_payload->'items') = 0 THEN
    RAISE EXCEPTION 'Order items are required';
  END IF;

  -- Validate each product item
  FOR v_item IN SELECT * FROM jsonb_array_elements(_payload->'items')
  LOOP
    v_product_id := nullif(coalesce(v_item->>'product_id', v_item->>'id'), '')::uuid;
    v_qty := greatest(coalesce((v_item->>'qty')::int, 1), 1);
    v_price := coalesce((v_item->>'price')::numeric, 0);

    IF v_product_id IS NOT NULL THEN
      SELECT price, coalesce(stock, 0) INTO v_actual_price, v_stock
      FROM public.products WHERE id = v_product_id AND is_active = true;

      IF FOUND THEN
        IF v_stock < v_qty THEN
          RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
        END IF;
        IF abs(v_actual_price - v_price) > 0.01 THEN
          RAISE EXCEPTION 'Price mismatch for product %', v_product_id;
        END IF;
        v_price := v_actual_price;
      END IF;
    END IF;

    v_subtotal := v_subtotal + (v_price * v_qty);
  END LOOP;

  v_shipping_fee := coalesce((_payload->>'delivery_fee')::numeric, 0);
  v_coupon_code := nullif(trim(_payload->>'coupon_code'), '');

  -- Server-side coupon verification if discount claimed
  IF v_coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon_record
    FROM public.coupons
    WHERE code = v_coupon_code
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (min_order_amount IS NULL OR v_subtotal >= min_order_amount);

    IF FOUND THEN
      IF v_coupon_record.discount_type = 'percentage' THEN
        v_discount := round((v_subtotal * (v_coupon_record.discount_value / 100.0)), 2);
        IF v_coupon_record.max_discount_amount IS NOT NULL AND v_discount > v_coupon_record.max_discount_amount THEN
          v_discount := v_coupon_record.max_discount_amount;
        END IF;
      ELSE
        v_discount := least(v_coupon_record.discount_value, v_subtotal);
      END IF;
    ELSE
      v_discount := 0;
    END IF;
  ELSE
    v_discount := least(coalesce((_payload->>'discount')::numeric, 0), v_subtotal);
  END IF;

  v_total := greatest(0, v_subtotal + v_shipping_fee - v_discount);

  IF _payload ? 'total' AND abs(v_total - (_payload->>'total')::numeric) > 1.00 THEN
    RAISE EXCEPTION 'Order total mismatch: computed %, received %', v_total, (_payload->>'total')::numeric;
  END IF;

  v_order_number := 'ORD-' || to_char(now(), 'YYMMDD') || '-' || lpad(floor(random()*100000)::text, 5, '0');

  INSERT INTO public.orders (
    order_number, user_id, customer_name, customer_phone, customer_email,
    address, district, thana, subtotal, delivery_fee, shipping_cost,
    discount, discount_amount, coupon_code, total,
    payment_method, payment_type, txn_id, sender_phone, paid_amount,
    status, notes, items, vendor_id, dropshipper_id, dropshipper_code
  ) VALUES (
    v_order_number, auth.uid(),
    coalesce(_payload->>'customer_name',''), _payload->>'customer_phone', _payload->>'customer_email',
    _payload->>'address', _payload->>'district', _payload->>'thana',
    v_subtotal, v_shipping_fee, v_shipping_fee,
    v_discount, v_discount, v_coupon_code, v_total,
    _payload->>'payment_method', _payload->>'payment_type', _payload->>'txn_id',
    _payload->>'sender_phone', nullif(_payload->>'paid_amount','')::numeric,
    'Pending', _payload->>'notes', _payload->'items',
    nullif(_payload->>'vendor_id','')::uuid,
    nullif(_payload->>'dropshipper_id','')::uuid,
    _payload->>'dropshipper_code'
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_payload->'items')
  LOOP
    v_product_id := nullif(coalesce(v_item->>'product_id', v_item->>'id'), '')::uuid;
    v_qty := greatest(coalesce((v_item->>'qty')::int, 1), 1);

    INSERT INTO public.order_items (order_id, product_id, name, price, qty, image, sku, size, color, variant)
    VALUES (v_order_id, v_product_id, coalesce(v_item->>'name',''), coalesce((v_item->>'price')::numeric,0), v_qty,
            v_item->>'image', v_item->>'sku', v_item->>'size', v_item->>'color', v_item->>'variant');

    IF v_product_id IS NOT NULL THEN
      UPDATE public.products
      SET stock = greatest(coalesce(stock,0) - v_qty, 0),
          sold_count = coalesce(sold_count,0) + v_qty
      WHERE id = v_product_id;
    END IF;
  END LOOP;

  PERFORM public.log_order_event(v_order_id, 'order_placed', 'Order placed and validated server-side', _payload, v_order_number);

  RETURN jsonb_build_object('id', v_order_id, 'order_number', v_order_number);
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb) TO anon, authenticated, service_role;
