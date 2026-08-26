-- Ensure RLS is enabled on dropshippers table
ALTER TABLE public.dropshippers ENABLE ROW LEVEL SECURITY;

-- Attempt to create the policy directly. 
-- If it exists, we drop it first to be safe and avoid "already exists" errors.
DROP POLICY IF EXISTS "Public can view approved dropshippers" ON public.dropshippers;

CREATE POLICY "Public can view approved dropshippers" 
ON public.dropshippers 
FOR SELECT 
TO anon, authenticated 
USING (status = 'approved');

-- Ensure grants are correct for the storefront to work via PostgREST
GRANT SELECT ON public.dropshippers TO anon, authenticated;
GRANT ALL ON public.dropshippers TO service_role;
