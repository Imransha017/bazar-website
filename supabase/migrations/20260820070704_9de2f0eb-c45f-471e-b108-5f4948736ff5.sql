-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add missing columns to coupons table
ALTER TABLE public.coupons ALTER COLUMN used_count SET NOT NULL;
ALTER TABLE public.coupons ALTER COLUMN used_count SET DEFAULT 0;

-- Add missing columns to affiliates table
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- Create order_activities table
CREATE TABLE IF NOT EXISTS public.order_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_activities TO authenticated;
GRANT ALL ON public.order_activities TO service_role;
ALTER TABLE public.order_activities ENABLE ROW LEVEL SECURITY;

-- Fix Review product_id nullability if needed
ALTER TABLE public.reviews ALTER COLUMN product_id SET NOT NULL;
