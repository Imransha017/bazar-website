-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS option_slug TEXT;

-- Update coupons table to match application expectations
ALTER TABLE public.coupons ALTER COLUMN discount_value SET NOT NULL;
ALTER TABLE public.coupons ALTER COLUMN discount_value SET DEFAULT 0;
ALTER TABLE public.coupons ALTER COLUMN discount_amount SET DEFAULT 0; -- Ensure it has a default if not provided

-- Final RLS policies for common storefront access (making categories and products readable)
CREATE POLICY "Public read for categories" ON public.categories FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Public read for products" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Public read for banners" ON public.banners FOR SELECT TO anon, authenticated USING (active = true);
