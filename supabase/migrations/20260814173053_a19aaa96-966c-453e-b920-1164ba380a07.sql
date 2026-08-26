
-- 1. Final attempt for blocking findings using direct DDL (avoiding generic loop if it fails)
-- 1.1 Lock down dropshippers table (Critical 2)
DROP POLICY IF EXISTS "public can view approved dropshippers" ON public.dropshippers;
DROP POLICY IF EXISTS "authenticated can view approved dropshippers" ON public.dropshippers;
CREATE POLICY "authenticated can view approved dropshippers" 
ON public.dropshippers FOR SELECT TO authenticated USING (status = 'approved');

-- 1.2 Lock down vendors table (Critical 4)
DROP POLICY IF EXISTS "Public can view approved vendors" ON public.vendors;
DROP POLICY IF EXISTS "authenticated can view approved vendors" ON public.vendors;
CREATE POLICY "authenticated can view approved vendors" 
ON public.vendors FOR SELECT TO authenticated USING (status = 'approved');

-- 1.3 Lock down order_status_history (Critical 3)
DROP POLICY IF EXISTS "public read history" ON public.order_status_history;
DROP POLICY IF EXISTS "authenticated can read own order history" ON public.order_status_history;
CREATE POLICY "authenticated can read own order history" 
ON public.order_status_history FOR SELECT TO authenticated 
USING ((EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.user_id = auth.uid())) OR has_role(auth.uid(), 'admin'::app_role));

-- 1.4 Ensure views are definitely invoker (Critical 1)
ALTER VIEW public.site_settings_public SET (security_invoker = true);
ALTER VIEW public.affiliate_settings_public SET (security_invoker = true);
ALTER VIEW public.dropshippers_public SET (security_invoker = true);

-- 2. Revoke execute on known sensitive functions individually
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_get_user_email(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_status_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.place_order(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_admin_email() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
