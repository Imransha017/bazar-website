-- Policies on public content reference helpers in the app_private schema; the
-- anonymous API role must be able to execute them (they expose no data).
GRANT USAGE ON SCHEMA app_private TO anon;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO anon;
GRANT EXECUTE ON FUNCTION app_private.get_my_vendor_id() TO anon;