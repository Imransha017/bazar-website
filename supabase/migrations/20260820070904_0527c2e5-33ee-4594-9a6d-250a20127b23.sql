-- Fix notifications table (ensure message column is properly set up)
ALTER TABLE public.notifications ALTER COLUMN message SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN message SET DEFAULT '';

-- Fix support tickets message issue in components
ALTER TABLE public.support_tickets ALTER COLUMN message SET NOT NULL;
ALTER TABLE public.support_tickets ALTER COLUMN message SET DEFAULT '';

-- Final check on has_role function (ensuring it matches exactly what components expect)
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
      AND role = _role
  );
$$;
