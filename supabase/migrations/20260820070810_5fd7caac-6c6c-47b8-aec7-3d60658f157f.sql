-- Final sync for products weight column (code expects number or string, making it decimal)
ALTER TABLE public.products DROP COLUMN IF EXISTS weight;
ALTER TABLE public.products ADD COLUMN weight DECIMAL(12,2);

-- Fix ReviewSection type errors: Ensure user_id is not null
ALTER TABLE public.reviews ALTER COLUMN user_id SET NOT NULL;

-- Fix OrderAutocomplete: Ensure main and sub are handled by making district and thana not null
ALTER TABLE public.addresses ALTER COLUMN district SET NOT NULL;
ALTER TABLE public.addresses ALTER COLUMN thana SET NOT NULL;

-- Fix password_reset_requests reviewed_at nullability
ALTER TABLE public.password_reset_requests ALTER COLUMN status SET DEFAULT 'pending';

-- Fix vendor Store slug
ALTER TABLE public.vendors ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.vendors ALTER COLUMN slug SET DEFAULT '';

-- Fix Order total nullability
ALTER TABLE public.orders ALTER COLUMN total SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN total SET DEFAULT 0;
