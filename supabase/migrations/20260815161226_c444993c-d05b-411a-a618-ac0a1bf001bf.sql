-- Ensure only admins can manage categories
-- This prevents dropshippers (who are 'authenticated' users but not 'admin')
-- from performing INSERT, UPDATE, or DELETE on categories.

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
ON public.categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ensure public read access remains for the storefront
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories"
ON public.categories
FOR SELECT
TO public
USING (true);

-- Ensure correct permissions are granted
GRANT ALL ON public.categories TO service_role;
GRANT SELECT ON public.categories TO authenticated;
GRANT SELECT ON public.categories TO anon;
