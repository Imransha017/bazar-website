-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS option_name TEXT;

-- Update coupons table to match application expectations
ALTER TABLE public.coupons ALTER COLUMN min_order SET NOT NULL;
ALTER TABLE public.coupons ALTER COLUMN min_order SET DEFAULT 0;
ALTER TABLE public.coupons ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.coupons ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE public.coupons ALTER COLUMN is_dropshipper_exclusive SET NOT NULL;
ALTER TABLE public.coupons ALTER COLUMN is_dropshipper_exclusive SET DEFAULT false;

-- Add affiliates table
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    store_name TEXT NOT NULL,
    store_slug TEXT UNIQUE,
    status TEXT DEFAULT 'pending',
    commission_pct DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliates TO authenticated;
GRANT ALL ON public.affiliates TO service_role;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Final fix for vendor slug nullability
ALTER TABLE public.vendors ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.vendors ALTER COLUMN slug SET DEFAULT '';
