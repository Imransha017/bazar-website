-- Ensure message column exists in support_tickets (some code might expect it here for the initial ticket body)
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';

-- Fix Address is_default nullability
ALTER TABLE public.addresses ALTER COLUMN is_default SET NOT NULL;
ALTER TABLE public.addresses ALTER COLUMN is_default SET DEFAULT false;

-- Fix password_reset_requests status nullability
ALTER TABLE public.password_reset_requests ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.password_reset_requests ALTER COLUMN status SET DEFAULT 'pending';

-- Fix Review user_id nullability (if the app expects reviews to always belong to a user)
ALTER TABLE public.reviews ALTER COLUMN user_id SET NOT NULL;

-- Ensure vendors have all columns for order.$id.tsx
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS store_slug TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Final sync for any missing dropshipper columns
ALTER TABLE public.dropshippers ADD COLUMN IF NOT EXISTS store_slug TEXT;
ALTER TABLE public.dropshippers ADD COLUMN IF NOT EXISTS logo_url TEXT;
