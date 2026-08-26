DROP POLICY IF EXISTS "Dropshipper view own orders" ON public.orders;
CREATE POLICY "Dropshipper view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  dropshipper_id IN (SELECT id FROM dropshippers WHERE user_id = auth.uid()) OR
  dropshipper_code IN (SELECT code FROM dropshippers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Vendor reads own orders" ON public.orders;
CREATE POLICY "Vendor reads own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(items) AS it
    WHERE (it->>'vendor_id')::uuid IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  )
);