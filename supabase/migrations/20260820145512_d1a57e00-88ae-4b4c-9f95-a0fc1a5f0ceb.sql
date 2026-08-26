-- ============ missing columns ============
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS items_json jsonb;

ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS total_earned numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_orders integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS props jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.product_video_reviews ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.dropshipper_short_links
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cart_adds_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversions_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.dropshippers
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS profile_image_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_order_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS real_time_popups_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS theme_color_primary text,
  ADD COLUMN IF NOT EXISTS theme_color_background text,
  ADD COLUMN IF NOT EXISTS theme_layout_style text,
  ADD COLUMN IF NOT EXISTS custom_domain text,
  ADD COLUMN IF NOT EXISTS domain_status text;

DO $$ BEGIN
  ALTER TABLE public.support_tickets
    ADD CONSTRAINT support_tickets_user_profile_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;

-- ============ promotions ============
CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement text NOT NULL DEFAULT 'top_bar',
  title text, message text NOT NULL DEFAULT '',
  link_url text, button_label text,
  bg_color text DEFAULT '#7c3aed', text_color text DEFAULT '#ffffff',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz, ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promotions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active promotions" ON public.promotions;
CREATE POLICY "Public read active promotions" ON public.promotions FOR SELECT TO anon, authenticated USING (active OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage promotions" ON public.promotions;
CREATE POLICY "Admins manage promotions" ON public.promotions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ site settings ============
CREATE TABLE IF NOT EXISTS public.site_settings (
  id integer PRIMARY KEY DEFAULT 1,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.site_settings (id, settings) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING;
GRANT SELECT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads site settings" ON public.site_settings;
CREATE POLICY "Anyone reads site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins update site settings" ON public.site_settings;
CREATE POLICY "Admins update site settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT SELECT ON public.site_settings TO anon;
CREATE OR REPLACE VIEW public.site_settings_public WITH (security_invoker=on) AS
  SELECT id, settings FROM public.site_settings;
GRANT SELECT ON public.site_settings_public TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads app settings" ON public.app_settings;
CREATE POLICY "Anyone reads app settings" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage app settings" ON public.app_settings;
CREATE POLICY "Admins manage app settings" ON public.app_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ affiliate program ============
CREATE TABLE IF NOT EXISTS public.affiliate_settings (
  id integer PRIMARY KEY DEFAULT 1,
  is_enabled boolean NOT NULL DEFAULT false,
  commission_pct numeric(6,2) NOT NULL DEFAULT 5,
  cookie_days integer NOT NULL DEFAULT 30,
  min_payout numeric(12,2) NOT NULL DEFAULT 500,
  terms text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.affiliate_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
GRANT SELECT, UPDATE ON public.affiliate_settings TO authenticated;
GRANT SELECT ON public.affiliate_settings TO anon;
GRANT ALL ON public.affiliate_settings TO service_role;
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads affiliate settings" ON public.affiliate_settings;
CREATE POLICY "Anyone reads affiliate settings" ON public.affiliate_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins update affiliate settings" ON public.affiliate_settings;
CREATE POLICY "Admins update affiliate settings" ON public.affiliate_settings FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE OR REPLACE VIEW public.affiliate_settings_public WITH (security_invoker=on) AS
  SELECT id, is_enabled, commission_pct, cookie_days FROM public.affiliate_settings;
GRANT SELECT ON public.affiliate_settings_public TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  path text, referrer text, user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.affiliate_clicks TO authenticated;
GRANT ALL ON public.affiliate_clicks TO service_role;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner or admin reads clicks" ON public.affiliate_clicks;
CREATE POLICY "Owner or admin reads clicks" ON public.affiliate_clicks FOR SELECT TO authenticated
  USING (public.is_admin() OR affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.affiliate_commissions TO authenticated;
GRANT ALL ON public.affiliate_commissions TO service_role;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner or admin reads commissions" ON public.affiliate_commissions;
CREATE POLICY "Owner or admin reads commissions" ON public.affiliate_commissions FOR SELECT TO authenticated
  USING (public.is_admin() OR affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage commissions" ON public.affiliate_commissions;
CREATE POLICY "Admins manage commissions" ON public.affiliate_commissions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  method text, details text, status text NOT NULL DEFAULT 'requested',
  admin_note text, txn_reference text, paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.affiliate_payouts TO authenticated;
GRANT ALL ON public.affiliate_payouts TO service_role;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner or admin reads payouts" ON public.affiliate_payouts;
CREATE POLICY "Owner or admin reads payouts" ON public.affiliate_payouts FOR SELECT TO authenticated
  USING (public.is_admin() OR affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Owner requests payout" ON public.affiliate_payouts;
CREATE POLICY "Owner requests payout" ON public.affiliate_payouts FOR INSERT TO authenticated
  WITH CHECK (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins update affiliate payouts" ON public.affiliate_payouts;
CREATE POLICY "Admins update affiliate payouts" ON public.affiliate_payouts FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ dropshipping program ============
CREATE TABLE IF NOT EXISTS public.dropshipper_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dropshipper_id uuid NOT NULL REFERENCES public.dropshippers(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  method text, account text, status text NOT NULL DEFAULT 'requested',
  admin_note text, txn_reference text, paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.dropshipper_payouts TO authenticated;
GRANT ALL ON public.dropshipper_payouts TO service_role;
ALTER TABLE public.dropshipper_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner or admin reads ds payouts" ON public.dropshipper_payouts;
CREATE POLICY "Owner or admin reads ds payouts" ON public.dropshipper_payouts FOR SELECT TO authenticated
  USING (public.is_admin() OR dropshipper_id IN (SELECT public.my_dropshipper_ids()));
DROP POLICY IF EXISTS "Owner requests ds payout" ON public.dropshipper_payouts;
CREATE POLICY "Owner requests ds payout" ON public.dropshipper_payouts FOR INSERT TO authenticated
  WITH CHECK (dropshipper_id IN (SELECT public.my_dropshipper_ids()));
DROP POLICY IF EXISTS "Admins update ds payouts" ON public.dropshipper_payouts;
CREATE POLICY "Admins update ds payouts" ON public.dropshipper_payouts FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.dropshipping_settings (
  id integer PRIMARY KEY DEFAULT 1,
  is_enabled boolean NOT NULL DEFAULT true,
  default_commission_pct numeric(6,2) NOT NULL DEFAULT 10,
  min_payout numeric(12,2) NOT NULL DEFAULT 500,
  cookie_days integer NOT NULL DEFAULT 30,
  auto_approve_apps boolean NOT NULL DEFAULT false,
  auto_approve_earnings boolean NOT NULL DEFAULT false,
  allowed_payout_methods text[] NOT NULL DEFAULT ARRAY['bkash','nagad','bank'],
  terms_md text, hero_title text, hero_subtitle text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.dropshipping_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
GRANT SELECT ON public.dropshipping_settings TO anon, authenticated;
GRANT UPDATE ON public.dropshipping_settings TO authenticated;
GRANT ALL ON public.dropshipping_settings TO service_role;
ALTER TABLE public.dropshipping_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads ds settings" ON public.dropshipping_settings;
CREATE POLICY "Anyone reads ds settings" ON public.dropshipping_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins update ds settings" ON public.dropshipping_settings;
CREATE POLICY "Admins update ds settings" ON public.dropshipping_settings FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.dropshipping_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, body_md text,
  tone text NOT NULL DEFAULT 'info',
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz, ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dropshipping_announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.dropshipping_announcements TO authenticated;
GRANT ALL ON public.dropshipping_announcements TO service_role;
ALTER TABLE public.dropshipping_announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads announcements" ON public.dropshipping_announcements;
CREATE POLICY "Anyone reads announcements" ON public.dropshipping_announcements FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage announcements" ON public.dropshipping_announcements;
CREATE POLICY "Admins manage announcements" ON public.dropshipping_announcements FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.short_link_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id uuid NOT NULL REFERENCES public.dropshipper_short_links(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.short_link_events TO authenticated;
GRANT ALL ON public.short_link_events TO service_role;
ALTER TABLE public.short_link_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner or admin reads link events" ON public.short_link_events;
CREATE POLICY "Owner or admin reads link events" ON public.short_link_events FOR SELECT TO authenticated
  USING (public.is_admin() OR short_link_id IN (SELECT id FROM public.dropshipper_short_links WHERE dropshipper_id IN (SELECT public.my_dropshipper_ids())));

CREATE TABLE IF NOT EXISTS public.dropshipper_feed_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dropshipper_id uuid NOT NULL REFERENCES public.dropshippers(id) ON DELETE CASCADE,
  item_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dropshipper_feed_logs TO authenticated;
GRANT ALL ON public.dropshipper_feed_logs TO service_role;
ALTER TABLE public.dropshipper_feed_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner or admin reads feed logs" ON public.dropshipper_feed_logs;
CREATE POLICY "Owner or admin reads feed logs" ON public.dropshipper_feed_logs FOR SELECT TO authenticated
  USING (public.is_admin() OR dropshipper_id IN (SELECT public.my_dropshipper_ids()));

CREATE TABLE IF NOT EXISTS public.product_marketing_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  asset_type text NOT NULL DEFAULT 'image',
  url text NOT NULL,
  title text, description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_marketing_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_marketing_assets TO authenticated;
GRANT ALL ON public.product_marketing_assets TO service_role;
ALTER TABLE public.product_marketing_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads marketing assets" ON public.product_marketing_assets;
CREATE POLICY "Anyone reads marketing assets" ON public.product_marketing_assets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage marketing assets" ON public.product_marketing_assets;
CREATE POLICY "Admins manage marketing assets" ON public.product_marketing_assets FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ logging ============
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'server',
  error_type text, message text NOT NULL DEFAULT '',
  stack text, url text, context jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.error_logs TO authenticated;
GRANT ALL ON public.error_logs TO service_role;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read error logs" ON public.error_logs;
CREATE POLICY "Admins read error logs" ON public.error_logs FOR SELECT TO authenticated USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL DEFAULT '',
  message text, content text,
  details jsonb, metadata jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read notifications" ON public.admin_notifications;
CREATE POLICY "Admins read notifications" ON public.admin_notifications FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins update notifications" ON public.admin_notifications;
CREATE POLICY "Admins update notifications" ON public.admin_notifications FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.order_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'info',
  severity text NOT NULL DEFAULT 'info',
  message text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_audit_logs TO authenticated;
GRANT ALL ON public.order_audit_logs TO service_role;
ALTER TABLE public.order_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read order audit" ON public.order_audit_logs;
CREATE POLICY "Admins read order audit" ON public.order_audit_logs FOR SELECT TO authenticated USING (public.is_admin());

-- ============ public dropshipper storefront view ============
CREATE OR REPLACE VIEW public.dropshippers_public WITH (security_invoker=on) AS
  SELECT id, code, store_name, store_slug, logo_url, banner_url, profile_image_url, bio, status,
         whatsapp, whatsapp_order_enabled, real_time_popups_enabled,
         theme_color_primary, theme_color_background, theme_layout_style, visibility_mode
  FROM public.dropshippers WHERE status = 'approved';
GRANT SELECT ON public.dropshippers_public TO anon, authenticated;
DROP POLICY IF EXISTS "Public reads approved dropshipper storefronts" ON public.dropshippers;
CREATE POLICY "Public reads approved dropshipper storefronts" ON public.dropshippers FOR SELECT TO anon, authenticated USING (status = 'approved');

-- ============ functions ============
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _subtotal numeric, _items jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.coupons%ROWTYPE; d numeric := 0;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE upper(code) = upper(_code) AND is_active = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Invalid coupon code'); END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN RETURN jsonb_build_object('ok', false, 'error', 'Coupon expired'); END IF;
  IF c.usage_limit IS NOT NULL AND c.used_count >= c.usage_limit THEN RETURN jsonb_build_object('ok', false, 'error', 'Coupon usage limit reached'); END IF;
  IF _subtotal < coalesce(c.min_order, c.min_order_amount, 0) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Minimum order amount not met');
  END IF;
  IF c.discount_type = 'percent' THEN d := _subtotal * coalesce(c.discount_value, c.discount_amount, 0) / 100.0;
  ELSE d := coalesce(c.discount_value, c.discount_amount, 0); END IF;
  IF c.max_discount IS NOT NULL THEN d := least(d, c.max_discount); END IF;
  d := least(round(d, 2), _subtotal);
  RETURN jsonb_build_object('ok', true, 'code', c.code, 'discount', d);
END; $$;
REVOKE ALL ON FUNCTION public.validate_coupon(text, numeric, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric, jsonb) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.track_affiliate_click(_code text, _path text DEFAULT NULL, _ref text DEFAULT NULL, _ua text DEFAULT NULL, _product_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a uuid;
BEGIN
  SELECT id INTO a FROM public.affiliates WHERE code = _code;
  IF a IS NULL THEN RETURN; END IF;
  INSERT INTO public.affiliate_clicks (affiliate_id, product_id, path, referrer, user_agent) VALUES (a, _product_id, _path, _ref, _ua);
END; $$;
REVOKE ALL ON FUNCTION public.track_affiliate_click(text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_affiliate_click(text, text, text, text, uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.track_dropshipper_click(_code text, _path text DEFAULT NULL, _ref text DEFAULT NULL, _ua text DEFAULT NULL, _product_id uuid DEFAULT NULL, _utm_source text DEFAULT NULL, _utm_campaign text DEFAULT NULL, _utm_medium text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d uuid;
BEGIN
  SELECT id INTO d FROM public.dropshippers WHERE code = _code;
  IF d IS NULL THEN RETURN; END IF;
  INSERT INTO public.dropshipper_clicks (dropshipper_id, product_id) VALUES (d, _product_id);
END; $$;
REVOKE ALL ON FUNCTION public.track_dropshipper_click(text, text, text, text, uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_dropshipper_click(text, text, text, text, uuid, text, text, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.attribute_order_to_affiliate(_order_id uuid, _code text, _product_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.affiliates%ROWTYPE; pct numeric; total numeric; amt numeric;
BEGIN
  SELECT * INTO a FROM public.affiliates WHERE code = _code AND status = 'approved';
  IF NOT FOUND THEN RETURN; END IF;
  SELECT o.total INTO total FROM public.orders o WHERE o.id = _order_id;
  IF total IS NULL THEN RETURN; END IF;
  pct := coalesce(a.commission_pct, (SELECT commission_pct FROM public.affiliate_settings WHERE id = 1), 0);
  amt := round(total * pct / 100.0, 2);
  UPDATE public.orders SET affiliate_id = a.id WHERE id = _order_id;
  INSERT INTO public.affiliate_commissions (affiliate_id, order_id, product_id, amount, status)
  VALUES (a.id, _order_id, _product_id, amt, 'pending');
  UPDATE public.affiliates SET total_orders = total_orders + 1, total_earned = total_earned + amt WHERE id = a.id;
END; $$;
REVOKE ALL ON FUNCTION public.attribute_order_to_affiliate(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attribute_order_to_affiliate(uuid, text, uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.attribute_order_to_dropshipper(_order_id uuid, _code text, _lines jsonb DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.dropshippers%ROWTYPE; total numeric; pct numeric; amt numeric;
BEGIN
  SELECT * INTO d FROM public.dropshippers WHERE code = _code;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT o.total INTO total FROM public.orders o WHERE o.id = _order_id;
  IF total IS NULL THEN RETURN; END IF;
  pct := coalesce((SELECT default_commission_pct FROM public.dropshipping_settings WHERE id = 1), 10);
  amt := round(total * pct / 100.0, 2);
  UPDATE public.orders SET dropshipper_id = d.id, dropshipper_code = d.code WHERE id = _order_id;
  INSERT INTO public.dropshipper_earnings (dropshipper_id, order_id, amount, status) VALUES (d.id, _order_id, amt, 'pending');
  UPDATE public.dropshippers SET total_orders = coalesce(total_orders,0) + 1, total_earned = coalesce(total_earned,0) + amt WHERE id = d.id;
END; $$;
REVOKE ALL ON FUNCTION public.attribute_order_to_dropshipper(uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attribute_order_to_dropshipper(uuid, text, jsonb) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.request_dropshipper_payout(_amount numeric, _method text, _account text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d uuid; new_id uuid;
BEGIN
  SELECT id INTO d FROM public.dropshippers WHERE user_id = auth.uid() LIMIT 1;
  IF d IS NULL THEN RAISE EXCEPTION 'No dropshipper profile'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  INSERT INTO public.dropshipper_payouts (dropshipper_id, amount, method, account, status)
  VALUES (d, _amount, _method, _account, 'requested') RETURNING id INTO new_id;
  RETURN new_id;
END; $$;
REVOKE ALL ON FUNCTION public.request_dropshipper_payout(numeric, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_dropshipper_payout(numeric, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.mark_dropshipper_payout_paid(_id uuid, _txn_reference text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.dropshipper_payouts SET status = 'paid', txn_reference = _txn_reference, paid_at = now() WHERE id = _id;
END; $$;
REVOKE ALL ON FUNCTION public.mark_dropshipper_payout_paid(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_dropshipper_payout_paid(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_adjust_dropshipper_earning(_id uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.dropshipper_earnings SET status = _status WHERE id = _id;
END; $$;
REVOKE ALL ON FUNCTION public.admin_adjust_dropshipper_earning(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_adjust_dropshipper_earning(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.increment_short_link_metric(link_id uuid, metric text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF metric = 'views_count' THEN UPDATE public.dropshipper_short_links SET views_count = views_count + 1 WHERE id = link_id;
  ELSIF metric = 'cart_adds_count' THEN UPDATE public.dropshipper_short_links SET cart_adds_count = cart_adds_count + 1 WHERE id = link_id;
  ELSIF metric = 'conversions_count' THEN UPDATE public.dropshipper_short_links SET conversions_count = conversions_count + 1 WHERE id = link_id;
  END IF;
END; $$;
REVOKE ALL ON FUNCTION public.increment_short_link_metric(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_short_link_metric(uuid, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_public_vendor(_slug text)
RETURNS TABLE (id uuid, store_name text, slug text, store_slug text, description text, logo_url text, banner_url text, city text, status text, footer jsonb, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.id, v.store_name, v.slug, v.store_slug, v.description, v.logo_url, v.banner_url, v.city, v.status, v.footer, v.created_at
  FROM public.vendors v WHERE (v.slug = _slug OR v.store_slug = _slug) AND v.status = 'approved' LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_public_vendor(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_vendor(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_public_vendor_by_id(_id uuid)
RETURNS TABLE (id uuid, store_name text, slug text, store_slug text, description text, logo_url text, banner_url text, city text, status text, footer jsonb, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.id, v.store_name, v.slug, v.store_slug, v.description, v.logo_url, v.banner_url, v.city, v.status, v.footer, v.created_at
  FROM public.vendors v WHERE v.id = _id AND v.status = 'approved' LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_public_vendor_by_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_vendor_by_id(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_review_authors(_ids uuid[])
RETURNS TABLE (id uuid, full_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.avatar_url FROM public.profiles p WHERE p.id = ANY(_ids);
$$;
REVOKE ALL ON FUNCTION public.get_review_authors(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_review_authors(uuid[]) TO anon, authenticated, service_role;