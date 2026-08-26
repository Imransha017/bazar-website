-- Ensure public tables have correct grants
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT SELECT ON public.banners TO anon, authenticated;
GRANT SELECT ON public.promotions TO anon, authenticated;
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT SELECT ON public.site_settings_public TO anon, authenticated;

GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.reviews TO service_role;
GRANT ALL ON public.banners TO service_role;
GRANT ALL ON public.promotions TO service_role;
GRANT ALL ON public.app_settings TO service_role;
GRANT ALL ON public.site_settings TO service_role;
GRANT ALL ON public.site_settings_public TO service_role;

-- Ensure RLS is enabled on these tables (though it likely already is)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Re-verify SELECT policy for products if it was missing or restrictive
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
CREATE POLICY "Enable read access for all users" ON public.products
FOR SELECT TO anon, authenticated
USING (is_active = true);

-- Categories are generally public
DROP POLICY IF EXISTS "Enable read access for all" ON public.categories;
CREATE POLICY "Enable read access for all" ON public.categories
FOR SELECT TO anon, authenticated
USING (true);

-- Reviews are public if approved
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews" ON public.reviews
FOR SELECT TO anon, authenticated
USING (is_approved = true);
