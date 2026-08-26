-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory_slug TEXT;

-- Add missing columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount DECIMAL(12,2) DEFAULT 0;

-- Add missing columns to coupons table
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_value DECIMAL(12,2) DEFAULT 0; -- App might use this instead of discount_amount

-- Create stock_logs table
CREATE TABLE IF NOT EXISTS public.stock_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    change_amount INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_logs TO authenticated;
GRANT ALL ON public.stock_logs TO service_role;
ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;

-- Final fix for Review nullability mismatch
ALTER TABLE public.reviews ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN comment SET NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN comment SET DEFAULT '';

-- Ensure notifications title is not null
ALTER TABLE public.notifications ALTER COLUMN title SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN title SET DEFAULT '';
