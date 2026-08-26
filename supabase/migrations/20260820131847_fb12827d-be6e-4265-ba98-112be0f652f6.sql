
-- 1. Force REVOKE and Re-grant for all existing tables
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'REVOKE ALL ON TABLE public.' || quote_ident(r.tablename) || ' FROM PUBLIC, anon, authenticated;';
        EXECUTE 'GRANT ALL ON TABLE public.' || quote_ident(r.tablename) || ' TO service_role, postgres;';
    END LOOP;
END $$;

-- 2. Granular re-grants
-- Public Data
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.banners TO anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT SELECT ON public.vendors TO anon, authenticated;
GRANT SELECT ON public.affiliates TO anon, authenticated;

-- User/Profile Data
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.addresses TO authenticated;
GRANT SELECT, INSERT ON public.wishlists TO authenticated;
GRANT SELECT, INSERT ON public.recent_views TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;

-- Dropshipper specific
GRANT SELECT, INSERT, UPDATE ON public.dropshippers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dropshipper_products TO authenticated;
GRANT SELECT ON public.dropshipper_earnings TO authenticated;

-- Orders (Selection granted to authenticated, but RLS restricts to owner)
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_activities TO authenticated;
GRANT SELECT ON public.order_events TO authenticated;

-- Sequences for inserts
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 3. Final Search Path Verification for all functions
ALTER FUNCTION public.has_role(uuid, text) SET search_path = public;
ALTER FUNCTION public.place_order(jsonb) SET search_path = public;
ALTER FUNCTION public.lookup_order(text, text) SET search_path = public;
ALTER FUNCTION public.log_order_event(uuid, text, text, jsonb, text) SET search_path = public;
ALTER FUNCTION public.admin_get_user_email(uuid) SET search_path = public;
