-- Add missing columns to coupons table
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_order DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_discount DECIMAL(12,2);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS usage_limit INTEGER;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS product_ids UUID[] DEFAULT '{}';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_dropshipper_exclusive BOOLEAN DEFAULT false;

-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory_name TEXT;

-- Final fix for Review comment nullability if it's still an issue
ALTER TABLE public.reviews ALTER COLUMN comment SET NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN comment SET DEFAULT '';

-- Ensure notifications message is NOT NULL (renaming body to message if needed or having both)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';
