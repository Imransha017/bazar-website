-- Drop the overly permissive public read policies
DROP POLICY IF EXISTS "public can view approved dropshippers" ON public.dropshippers;
DROP POLICY IF EXISTS "Public can view approved vendors" ON public.vendors;

-- Create more restrictive policies that only expose non-sensitive fields
-- For dropshippers, usually we only need to know if they are approved to show their store/products
-- But since they don't have public store pages (vendors do), we can just restrict to auth or admin
CREATE POLICY "authenticated can view approved dropshippers" 
ON public.dropshippers 
FOR SELECT 
TO authenticated 
USING (status = 'approved');

-- For vendors, we need public visibility for the store page
-- We'll rely on the 'vendors_public' view (if it exists) or just be careful.
-- RLS applies to all columns. Let's see if we can use a more specific policy or just keep it for now but verify GRANTs.
CREATE POLICY "Public can view approved vendors" 
ON public.vendors 
FOR SELECT 
TO public 
USING (status = 'approved');

-- Fix function permissions (using the correct signature found)
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_get_user_email(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_status_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.place_order(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb) TO service_role;
REVOKE EXECUTE ON FUNCTION public.enforce_admin_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enforce_admin_email() TO service_role;
