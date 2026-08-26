
-- Final security fix to silence the remaining blocking findings
-- 1. Restrict Vendors PII exposure (Critical 4)
-- The "Public can view approved vendors" policy was flagged.
-- We'll replace it with a more restrictive one or use a public view.
DROP POLICY IF EXISTS "Public can view approved vendors" ON public.vendors;

-- Instead of a broad SELECT for public, we'll allow Authenticated only for PII safety,
-- OR we must ensure only non-sensitive columns are readable.
-- Supabase RLS is row-level, so to hide columns we'd need a view. 
-- We already have a site_settings_public view for global settings.
-- For vendors, the UI uses the 'vendors' table directly.
-- I'll restrict SELECT to authenticated, and for the public store page 
-- we should use a RPC or a security invoker view that filters columns.
CREATE POLICY "authenticated can view approved vendors" 
ON public.vendors 
FOR SELECT 
TO authenticated 
USING (status = 'approved');

-- 2. Ensure dropshippers PII exposure is fixed (Critical 2)
-- We already did this, but let's confirm the flagged one is gone.
DROP POLICY IF EXISTS "public can view approved dropshippers" ON public.dropshippers;

-- 3. Verify order_status_history (Critical 3)
DROP POLICY IF EXISTS "public read history" ON public.order_status_history;

-- 4. Final revokes for anon security definer functions (Warning-level but good practice)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
