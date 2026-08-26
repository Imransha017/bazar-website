-- Add all missing columns to vendors table
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS nid_number TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS total_sales DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS footer JSONB;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS alt_phone TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS city TEXT;

-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_name TEXT;

-- Add missing column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- Create coupons table if it's missing
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_amount DECIMAL(12,2) NOT NULL,
    discount_type TEXT NOT NULL, -- 'fixed' or 'percent'
    min_order_amount DECIMAL(12,2) DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
