-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dropshipper_price DECIMAL(12,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2);

-- Fix Review is_approved nullability
ALTER TABLE public.reviews ALTER COLUMN is_approved SET NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN is_approved SET DEFAULT false;

-- Add missing columns to vendors table (if any remaining)
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS store_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS phone TEXT;

-- Final RLS policies for common access
CREATE POLICY "Public read for vendors" ON public.vendors FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Public read for affiliates" ON public.affiliates FOR SELECT TO anon, authenticated USING (status = 'approved');
