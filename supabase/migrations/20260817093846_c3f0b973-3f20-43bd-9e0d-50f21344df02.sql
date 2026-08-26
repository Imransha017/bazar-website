-- Ensure dropshipper_products are visible to everyone
GRANT SELECT ON public.dropshipper_products TO anon, authenticated;

-- Ensure dropshippers_public is visible to everyone
GRANT SELECT ON public.dropshippers_public TO anon, authenticated;

-- Update RLS policies for dropshipper_products
DROP POLICY IF EXISTS "Dropshipper products are viewable by everyone" ON public.dropshipper_products;
CREATE POLICY "Dropshipper products are viewable by everyone"
ON public.dropshipper_products
FOR SELECT
TO public
USING (true);

-- Ensure products are visible to everyone
GRANT SELECT ON public.products TO anon, authenticated;

-- Make sure dropshippers table is readable by authenticated and anon for the public store view
GRANT SELECT ON public.dropshippers TO anon, authenticated;