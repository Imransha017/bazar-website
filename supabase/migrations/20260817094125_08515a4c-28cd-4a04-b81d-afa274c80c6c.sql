-- Re-enable RLS and ensure grants for dropshipper storefront visibility
GRANT SELECT ON public.dropshipper_products TO anon, authenticated;
GRANT SELECT ON public.dropshippers TO anon, authenticated;
GRANT SELECT ON public.dropshippers_public TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;

-- Ensure permissive policy for dropshipper_products
DROP POLICY IF EXISTS "Dropshipper products are viewable by everyone" ON public.dropshipper_products;
CREATE POLICY "Dropshipper products are viewable by everyone"
ON public.dropshipper_products
FOR SELECT
TO public
USING (true);

-- Ensure dropshippers_public view works correctly (it should inherited grants but lets be explicit)
GRANT SELECT ON public.dropshippers_public TO anon, authenticated;
