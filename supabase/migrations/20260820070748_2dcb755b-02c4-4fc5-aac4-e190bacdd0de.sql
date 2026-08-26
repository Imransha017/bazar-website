-- Fix Order customer_name nullability for vendor dashboard
ALTER TABLE public.orders ALTER COLUMN customer_name SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN customer_name SET DEFAULT '';
ALTER TABLE public.orders ALTER COLUMN total SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN total SET DEFAULT 0;
ALTER TABLE public.orders ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending';

-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cod_available BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS offer_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS offer_starts_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS return_days INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight TEXT;
