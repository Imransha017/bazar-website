-- Fix infinite recursion in dropshippers policy if it still persists or was improperly handled
-- The user reported "infinite recursion detected in policy for relation dropshippers" during application.

-- 1. Ensure the security definer function exists and is robust
CREATE OR REPLACE FUNCTION public.my_dropshipper_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id FROM public.dropshippers WHERE user_id = auth.uid()
$function$;

-- 2. Drop the problematic recursive policy
DROP POLICY IF EXISTS "Parents can see sub-affiliate performance" ON public.dropshippers;

-- 3. Re-create it using the non-recursive function approach
CREATE POLICY "Parents can see sub-affiliate performance"
ON public.dropshippers
FOR SELECT
TO authenticated
USING (
  parent_dropshipper_id IN (SELECT public.my_dropshipper_ids())
);

-- 4. Fix potential Security Definer View issues reported by linter
-- We should ensure views are created with security_invoker = true where possible (Postgres 15+)
-- or ensure the underlying tables have proper RLS.
-- For this environment, we'll focus on the RLS recursion which is the primary blocker.

GRANT EXECUTE ON FUNCTION public.my_dropshipper_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_dropshipper_ids() TO service_role;
