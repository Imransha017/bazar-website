DROP POLICY IF EXISTS "Dropshipper products are viewable by everyone" ON public.dropshipper_products;
CREATE POLICY "Dropshipper products are viewable by everyone" ON public.dropshipper_products FOR SELECT USING (true);
GRANT SELECT ON public.dropshipper_products TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
