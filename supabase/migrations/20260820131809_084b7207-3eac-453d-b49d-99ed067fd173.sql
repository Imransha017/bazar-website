
-- 1. Fix search_path for admin_get_user_email
ALTER FUNCTION public.admin_get_user_email(uuid) SET search_path = public;

-- 2. Restrict EXECUTE on sensitive functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.place_order(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.lookup_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order(text, text) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.log_order_event(uuid, text, text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_order_event(uuid, text, text, jsonb, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.admin_get_user_email(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_user_email(uuid) TO authenticated, service_role;

-- 3. Ensure RLS Policies for previously missing tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can see all activities') THEN
        CREATE POLICY "Admins can see all activities" ON public.order_activities FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can see all events') THEN
        CREATE POLICY "Admins can see all events" ON public.order_events FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can see all stock logs') THEN
        CREATE POLICY "Admins can see all stock logs" ON public.stock_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
    END IF;
END $$;

-- 4. Fix view security
CREATE OR REPLACE VIEW public.dropshipper_products_view AS 
 SELECT dp.id,
    dp.dropshipper_id,
    dp.product_id,
    dp.is_active,
    dp.created_at,
    dp.custom_title,
    dp.custom_description,
    dp.retail_price,
    dp.visibility_mode,
    p.name AS product_name,
    p.image AS product_image,
    p.price AS base_price,
    p.category_slug,
    p.subcategory_slug,
    p.is_active AS product_active
   FROM dropshipper_products dp
     JOIN products p ON dp.product_id = p.id
  WHERE dp.is_active = true AND p.is_active = true;

GRANT SELECT ON public.dropshipper_products_view TO anon, authenticated;
