-- Drop and recreate has_role function with correct signature
DROP FUNCTION IF EXISTS public.has_role(TEXT, UUID);
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Fix ReviewSection type errors: Ensure rating is not null in database to avoid null | number mismatch
ALTER TABLE public.reviews ALTER COLUMN rating SET NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN rating SET DEFAULT 0;

-- Fix OrderAutocomplete: Ensure district and thana are not null
ALTER TABLE public.addresses ALTER COLUMN full_name SET NOT NULL;
ALTER TABLE public.addresses ALTER COLUMN phone SET NOT NULL;
ALTER TABLE public.addresses ALTER COLUMN district SET NOT NULL;
ALTER TABLE public.addresses ALTER COLUMN thana SET NOT NULL;
ALTER TABLE public.addresses ALTER COLUMN address SET NOT NULL;
ALTER TABLE public.addresses ALTER COLUMN is_default SET DEFAULT false;

-- Fix Dropshipping Support errors
ALTER TABLE public.support_tickets ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.support_tickets ALTER COLUMN status SET DEFAULT 'open';
ALTER TABLE public.support_tickets ALTER COLUMN priority SET NOT NULL;
ALTER TABLE public.support_tickets ALTER COLUMN priority SET DEFAULT 'medium';
ALTER TABLE public.support_tickets ALTER COLUMN category SET NOT NULL;
ALTER TABLE public.support_tickets ALTER COLUMN category SET DEFAULT 'general';

-- Update products table to match all expected columns in dropshipping.products.tsx
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_slug TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;

-- Add dropshipper_products table if missing (used in dropshipping.products.tsx)
CREATE TABLE IF NOT EXISTS public.dropshipper_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dropshipper_id UUID REFERENCES public.dropshippers(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    custom_title TEXT,
    custom_description TEXT,
    retail_price DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(dropshipper_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dropshipper_products TO authenticated;
GRANT ALL ON public.dropshipper_products TO service_role;
ALTER TABLE public.dropshipper_products ENABLE ROW LEVEL SECURITY;

-- Notifications table corrections
ALTER TABLE public.notifications ALTER COLUMN title SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN message SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN is_read SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN is_read SET DEFAULT false;
