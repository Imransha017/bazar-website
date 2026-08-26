
-- Fix SECURITY DEFINER views by dropping them and replacing with RLS on base tables or SECURITY INVOKER views
DROP VIEW IF EXISTS public.site_settings_public;
DROP VIEW IF EXISTS public.affiliate_settings_public;
DROP VIEW IF EXISTS public.dropshippers_public;

CREATE VIEW public.site_settings_public WITH (security_invoker = true) AS 
SELECT id, settings, updated_at FROM public.site_settings WHERE id = 1;

CREATE VIEW public.affiliate_settings_public WITH (security_invoker = true) AS 
SELECT id, is_enabled, commission_pct, cookie_days FROM public.affiliate_settings WHERE id = 1;

CREATE VIEW public.dropshippers_public WITH (security_invoker = true) AS 
SELECT id, code, store_name, store_slug, logo_url, banner_url, bio, status FROM public.dropshippers WHERE status = 'approved';

-- Restrict order_status_history read access
DROP POLICY IF EXISTS "public read history" ON public.order_status_history;
CREATE POLICY "Users can read own order history"
ON public.order_status_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_status_history.order_id 
    AND orders.user_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin')
);

-- Ensure vendors and dropshippers don't expose PII
-- (Assuming standard RLS applies, but we check if any policies are too broad)
-- The views above already help by selecting specific columns.
