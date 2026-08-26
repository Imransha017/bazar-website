-- Create app_role enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'vendor', 'dropshipper', 'customer');
    END IF;
END$$;

-- Add updated_at to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Fix password_reset_requests schema
ALTER TABLE public.password_reset_requests ADD COLUMN IF NOT EXISTS new_password_hash TEXT DEFAULT '';
UPDATE public.password_reset_requests SET new_password_hash = '' WHERE new_password_hash IS NULL;
ALTER TABLE public.password_reset_requests ALTER COLUMN new_password_hash SET NOT NULL;

-- Fix has_role function
DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT);
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
      AND role::TEXT = _role
  );
$$;
