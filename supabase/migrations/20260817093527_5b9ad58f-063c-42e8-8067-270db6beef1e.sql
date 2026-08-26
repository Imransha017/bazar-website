GRANT SELECT ON public.dropshipper_products TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.dropshippers TO anon, authenticated;

-- Fix the 'public' role issue in the existing policy if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public view active imported' AND tablename = 'dropshipper_products') THEN
        DROP POLICY "public view active imported" ON public.dropshipper_products;
    END IF;
END $$;

CREATE POLICY "public view active imported"
ON public.dropshipper_products
FOR SELECT
TO anon, authenticated
USING (
    is_active = true 
    AND EXISTS (
        SELECT 1 FROM public.dropshippers d 
        WHERE d.id = dropshipper_products.dropshipper_id 
        AND d.status = 'approved'
    )
);
