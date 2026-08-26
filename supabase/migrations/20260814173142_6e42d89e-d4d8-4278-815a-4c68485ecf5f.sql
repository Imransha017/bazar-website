
-- 1. Resolve blocking security findings for publishing
-- 1.1 Lock down dropshippers table (Critical 2)
DROP POLICY IF EXISTS "public can view approved dropshippers" ON public.dropshippers;
DROP POLICY IF EXISTS "authenticated can view approved dropshippers" ON public.dropshippers;
-- Re-create only the authenticated policy
CREATE POLICY "authenticated can view approved dropshippers" 
ON public.dropshippers 
FOR SELECT 
TO authenticated 
USING (status = 'approved');

-- 1.2 Lock down vendors table (Critical 4)
DROP POLICY IF EXISTS "Public can view approved vendors" ON public.vendors;
DROP POLICY IF EXISTS "authenticated can view approved vendors" ON public.vendors;
-- Re-create only the authenticated policy
CREATE POLICY "authenticated can view approved vendors" 
ON public.vendors 
FOR SELECT 
TO authenticated 
USING (status = 'approved');

-- 1.3 Lock down order_status_history (Critical 3)
DROP POLICY IF EXISTS "public read history" ON public.order_status_history;
DROP POLICY IF EXISTS "authenticated can read own order history" ON public.order_status_history;
-- Re-create only the authenticated policy with owner/admin checks
CREATE POLICY "authenticated can read own order history" 
ON public.order_status_history 
FOR SELECT 
TO authenticated 
USING (
    (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.user_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
);

-- 1.4 Address Security Definer Views (Critical 1)
-- Converting these to security_invoker to respect RLS
ALTER VIEW public.site_settings_public SET (security_invoker = true);
ALTER VIEW public.affiliate_settings_public SET (security_invoker = true);
ALTER VIEW public.dropshippers_public SET (security_invoker = true);

-- 2. Revoke public execute from sensitive security definer functions (Warning-level)
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_get_user_email(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_status_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.place_order(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_admin_email() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;

-- Re-grant execute to authenticated users for necessary functions
GRANT EXECUTE ON FUNCTION public.place_order(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
