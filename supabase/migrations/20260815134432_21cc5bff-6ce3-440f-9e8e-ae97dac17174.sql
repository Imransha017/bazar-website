CREATE OR REPLACE FUNCTION public.attribute_order_to_dropshipper(
  _order_id uuid,
  _code text,
  _lines jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ds_id uuid;
  v_line jsonb;
  v_profit numeric;
BEGIN
  -- 1. Find the dropshipper by code
  SELECT id INTO v_ds_id FROM public.dropshippers WHERE code = _code;
  
  IF v_ds_id IS NULL THEN
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
END;
$$;

GRANT EXECUTE ON FUNCTION public.attribute_order_to_dropshipper(uuid, text, jsonb) TO anon, authenticated;
