-- Row-level security policies call these helpers, so every request (including
-- signed-out storefront visitors) must be able to execute them.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.my_vendor_ids() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.my_dropshipper_ids() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_vendor_id() TO anon, authenticated;