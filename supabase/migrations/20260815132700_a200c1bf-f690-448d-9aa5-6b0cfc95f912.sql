
-- 1. Create the attribution function if it doesn't exist or update it
-- This function handles the financial split and earning records
CREATE OR REPLACE FUNCTION public.attribute_order_to_dropshipper(
    _order_id uuid,
    _code text,
    _lines jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    ds_id uuid;
    line jsonb;
    p_id uuid;
    b_price numeric;
    r_price numeric;
    qty_val int;
    prof numeric;
BEGIN
    -- Resolve dropshipper
    SELECT id INTO ds_id FROM public.dropshippers WHERE code = _code LIMIT 1;
    IF ds_id IS NULL THEN
        RETURN;
    END IF;

    -- Update order with dropshipper_id if missing
    UPDATE public.orders 
    SET dropshipper_id = ds_id, dropshipper_code = _code
    WHERE id = _order_id AND (dropshipper_id IS NULL OR dropshipper_code IS NULL);

    -- Process lines for earnings
    FOR line IN SELECT * FROM jsonb_array_elements(_lines) LOOP
        p_id := (line->>'product_id')::uuid;
        b_price := (line->>'base_price')::numeric;
        r_price := (line->>'retail_price')::numeric;
        qty_val := (line->>'qty')::int;
        prof := (r_price - b_price) * qty_val;

        IF prof > 0 THEN
            INSERT INTO public.dropshipper_earnings (
                dropshipper_id, order_id, product_id, base_price, retail_price, qty, profit, status
            ) VALUES (
                ds_id, _order_id, p_id, b_price, r_price, qty_val, prof, 'pending'
            );
        END IF;
    END LOOP;

    -- Update totals
    UPDATE public.dropshippers
    SET total_orders = total_orders + 1,
        total_earned = total_earned + (SELECT COALESCE(SUM(profit), 0) FROM public.dropshipper_earnings WHERE order_id = _order_id AND dropshipper_id = ds_id)
    WHERE id = ds_id;
END;
$$;

-- 2. Update RLS policies for visibility
-- Fix Vendor policy to ensure they see orders even if linked to DS
DROP POLICY IF EXISTS "Vendor reads own orders" ON public.orders;
CREATE POLICY "Vendor reads own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
    vendor_id = get_my_vendor_id() 
    OR 
    EXISTS (
        SELECT 1 FROM jsonb_array_elements(items) as it
        WHERE (it->>'vendor_id')::uuid = get_my_vendor_id()
    )
);

-- Ensure Dropshipper can see orders even if not yet logged in or if attribution is delayed
DROP POLICY IF EXISTS "Dropshipper view own orders" ON public.orders;
CREATE POLICY "Dropshipper view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
    dropshipper_id = (SELECT id FROM dropshippers WHERE user_id = auth.uid() LIMIT 1)
);

-- Grant access to RPCs
GRANT EXECUTE ON FUNCTION public.place_order(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.attribute_order_to_dropshipper(uuid, text, jsonb) TO anon, authenticated;
