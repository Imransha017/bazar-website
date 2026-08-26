-- Helper: current user's vendor ids / dropshipper ids
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.my_vendor_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.vendors WHERE user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.my_vendor_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_vendor_ids() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.my_dropshipper_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.dropshippers WHERE user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.my_dropshipper_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_dropshipper_ids() TO authenticated, service_role;

-- ============ PRODUCTS ============
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Vendors manage own products" ON public.products;
CREATE POLICY "Vendors manage own products" ON public.products FOR ALL TO authenticated
  USING (vendor_id IN (SELECT public.my_vendor_ids()))
  WITH CHECK (vendor_id IN (SELECT public.my_vendor_ids()));

-- ============ CATEGORIES / BANNERS ============
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON public.banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
DROP POLICY IF EXISTS "Admins manage banners" ON public.banners;
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ COUPONS ============
GRANT SELECT ON public.coupons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;
CREATE POLICY "Anyone can read active coupons" ON public.coupons FOR SELECT TO anon, authenticated
  USING (is_active = true);
DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ ORDERS ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
DROP POLICY IF EXISTS "Authenticated users can select everything" ON public.orders;
DROP POLICY IF EXISTS "Order participants can read" ON public.orders;
CREATE POLICY "Order participants can read" ON public.orders FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR vendor_id IN (SELECT public.my_vendor_ids())
    OR dropshipper_id IN (SELECT public.my_dropshipper_ids())
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Admins and vendors update orders" ON public.orders;
CREATE POLICY "Admins and vendors update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.is_admin() OR vendor_id IN (SELECT public.my_vendor_ids()))
  WITH CHECK (public.is_admin() OR vendor_id IN (SELECT public.my_vendor_ids()));
DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============ ORDER EVENTS / ACTIVITIES / STOCK LOGS ============
GRANT SELECT, INSERT ON public.order_events TO authenticated;
GRANT ALL ON public.order_events TO service_role;
DROP POLICY IF EXISTS "Participants read order events" ON public.order_events;
CREATE POLICY "Participants read order events" ON public.order_events FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders));
DROP POLICY IF EXISTS "Authenticated insert order events" ON public.order_events;
CREATE POLICY "Authenticated insert order events" ON public.order_events FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM public.orders));

GRANT SELECT, INSERT ON public.order_activities TO authenticated;
GRANT ALL ON public.order_activities TO service_role;
DROP POLICY IF EXISTS "Participants read order activities" ON public.order_activities;
CREATE POLICY "Participants read order activities" ON public.order_activities FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders));
DROP POLICY IF EXISTS "Authenticated insert order activities" ON public.order_activities;
CREATE POLICY "Authenticated insert order activities" ON public.order_activities FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM public.orders));

GRANT SELECT, INSERT ON public.stock_logs TO authenticated;
GRANT ALL ON public.stock_logs TO service_role;
DROP POLICY IF EXISTS "Admins and vendors read stock logs" ON public.stock_logs;
CREATE POLICY "Admins and vendors read stock logs" ON public.stock_logs FOR SELECT TO authenticated
  USING (public.is_admin() OR product_id IN (SELECT id FROM public.products));
DROP POLICY IF EXISTS "Authenticated insert stock logs" ON public.stock_logs;
CREATE POLICY "Authenticated insert stock logs" ON public.stock_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============ NOTIFICATIONS ============
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

GRANT SELECT, UPDATE ON public.vendor_notifications TO authenticated;
GRANT ALL ON public.vendor_notifications TO service_role;
DROP POLICY IF EXISTS "Vendors read own notifications" ON public.vendor_notifications;
CREATE POLICY "Vendors read own notifications" ON public.vendor_notifications FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT public.my_vendor_ids()) OR public.is_admin());
DROP POLICY IF EXISTS "Vendors update own notifications" ON public.vendor_notifications;
CREATE POLICY "Vendors update own notifications" ON public.vendor_notifications FOR UPDATE TO authenticated
  USING (vendor_id IN (SELECT public.my_vendor_ids()))
  WITH CHECK (vendor_id IN (SELECT public.my_vendor_ids()));

-- ============ SUPPORT ============
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
DROP POLICY IF EXISTS "Users read own tickets" ON public.support_tickets;
CREATE POLICY "Users read own tickets" ON public.support_tickets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Users create tickets" ON public.support_tickets;
CREATE POLICY "Users create tickets" ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Owner or admin update tickets" ON public.support_tickets;
CREATE POLICY "Owner or admin update tickets" ON public.support_tickets FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
DROP POLICY IF EXISTS "Ticket participants read messages" ON public.support_messages;
CREATE POLICY "Ticket participants read messages" ON public.support_messages FOR SELECT TO authenticated
  USING (ticket_id IN (SELECT id FROM public.support_tickets));
DROP POLICY IF EXISTS "Ticket participants send messages" ON public.support_messages;
CREATE POLICY "Ticket participants send messages" ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND ticket_id IN (SELECT id FROM public.support_tickets));

-- ============ DROPSHIPPER DATA ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dropshipper_earnings TO authenticated;
GRANT ALL ON public.dropshipper_earnings TO service_role;
DROP POLICY IF EXISTS "Dropshippers read own earnings" ON public.dropshipper_earnings;
CREATE POLICY "Dropshippers read own earnings" ON public.dropshipper_earnings FOR SELECT TO authenticated
  USING (dropshipper_id IN (SELECT public.my_dropshipper_ids()) OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage earnings" ON public.dropshipper_earnings;
CREATE POLICY "Admins manage earnings" ON public.dropshipper_earnings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, INSERT ON public.dropshipper_clicks TO anon, authenticated;
GRANT ALL ON public.dropshipper_clicks TO service_role;
DROP POLICY IF EXISTS "Anyone can log clicks" ON public.dropshipper_clicks;
CREATE POLICY "Anyone can log clicks" ON public.dropshipper_clicks FOR INSERT TO anon, authenticated
  WITH CHECK (true);
DROP POLICY IF EXISTS "Dropshippers read own clicks" ON public.dropshipper_clicks;
CREATE POLICY "Dropshippers read own clicks" ON public.dropshipper_clicks FOR SELECT TO authenticated
  USING (dropshipper_id IN (SELECT public.my_dropshipper_ids()) OR public.is_admin());

GRANT SELECT ON public.dropshipper_short_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dropshipper_short_links TO authenticated;
GRANT ALL ON public.dropshipper_short_links TO service_role;
DROP POLICY IF EXISTS "Public read short links" ON public.dropshipper_short_links;
CREATE POLICY "Public read short links" ON public.dropshipper_short_links FOR SELECT TO anon, authenticated
  USING (true);

GRANT SELECT ON public.product_video_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_video_reviews TO authenticated;
GRANT ALL ON public.product_video_reviews TO service_role;
DROP POLICY IF EXISTS "Public read video reviews" ON public.product_video_reviews;
CREATE POLICY "Public read video reviews" ON public.product_video_reviews FOR SELECT TO anon, authenticated
  USING (true);

-- ============ ADMIN-ONLY TABLES ============
GRANT SELECT, UPDATE ON public.password_reset_requests TO authenticated;
GRANT ALL ON public.password_reset_requests TO service_role;
DROP POLICY IF EXISTS "Admins read reset requests" ON public.password_reset_requests;
CREATE POLICY "Admins read reset requests" ON public.password_reset_requests FOR SELECT TO authenticated
  USING (public.is_admin());
DROP POLICY IF EXISTS "Admins update reset requests" ON public.password_reset_requests;
CREATE POLICY "Admins update reset requests" ON public.password_reset_requests FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;
DROP POLICY IF EXISTS "Admins read audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins read audit logs" ON public.admin_audit_logs FOR SELECT TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT ON public.analytics_events TO anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;
DROP POLICY IF EXISTS "Anyone can log analytics" ON public.analytics_events;
CREATE POLICY "Anyone can log analytics" ON public.analytics_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);
DROP POLICY IF EXISTS "Admins read analytics" ON public.analytics_events;
CREATE POLICY "Admins read analytics" ON public.analytics_events FOR SELECT TO authenticated
  USING (public.is_admin());

-- ============ VENDORS / DROPSHIPPERS / ROLES admin management ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT SELECT ON public.vendors TO anon;
GRANT ALL ON public.vendors TO service_role;
DROP POLICY IF EXISTS "Admins manage vendors" ON public.vendors;
CREATE POLICY "Admins manage vendors" ON public.vendors FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Vendors update own store" ON public.vendors;
CREATE POLICY "Vendors update own store" ON public.vendors FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users apply as vendor" ON public.vendors;
CREATE POLICY "Users apply as vendor" ON public.vendors FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dropshippers TO authenticated;
GRANT SELECT ON public.dropshippers TO anon;
GRANT ALL ON public.dropshippers TO service_role;
DROP POLICY IF EXISTS "Admins manage dropshippers" ON public.dropshippers;
CREATE POLICY "Admins manage dropshippers" ON public.dropshippers FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ REVIEWS moderation ============
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
DROP POLICY IF EXISTS "Users write own reviews" ON public.reviews;
CREATE POLICY "Users write own reviews" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins moderate reviews" ON public.reviews;
CREATE POLICY "Admins moderate reviews" ON public.reviews FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ AFFILIATES ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliates TO authenticated;
GRANT ALL ON public.affiliates TO service_role;
DROP POLICY IF EXISTS "Admins manage affiliates" ON public.affiliates;
CREATE POLICY "Admins manage affiliates" ON public.affiliates FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Users apply as affiliate" ON public.affiliates;
CREATE POLICY "Users apply as affiliate" ON public.affiliates FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());