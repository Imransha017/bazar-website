ALTER TABLE public.dropshippers ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.dropshipper_products ADD COLUMN IF NOT EXISTS custom_title TEXT;
ALTER TABLE public.dropshipper_products ADD COLUMN IF NOT EXISTS custom_description TEXT;
ALTER TABLE public.dropshipper_products ADD COLUMN IF NOT EXISTS retail_price DECIMAL(12,2);
