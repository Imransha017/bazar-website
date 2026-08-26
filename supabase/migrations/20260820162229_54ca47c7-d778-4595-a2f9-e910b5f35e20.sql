-- 1. Customer order cancel / revision requests
CREATE TABLE IF NOT EXISTS public.order_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid,
  order_number text NOT NULL,
  customer_phone text NOT NULL,
  customer_name text,
  type text NOT NULL DEFAULT 'cancel',
  reason text,
  details text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_requests TO authenticated;
GRANT ALL ON public.order_requests TO service_role;
ALTER TABLE public.order_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage order requests" ON public.order_requests;
CREATE POLICY "admins manage order requests" ON public.order_requests
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "users see own order requests" ON public.order_requests;
CREATE POLICY "users see own order requests" ON public.order_requests
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.order_number = order_requests.order_number AND o.user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.submit_order_request(
  _order_number text, _phone text, _type text, _reason text DEFAULT NULL, _details text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o public.orders%ROWTYPE; new_id uuid;
BEGIN
  SELECT * INTO o FROM public.orders
   WHERE order_number = _order_number
     AND customer_phone IS NOT NULL
     AND regexp_replace(customer_phone, '\D', '', 'g') = regexp_replace(coalesce(_phone,''), '\D', '', 'g')
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order not found or phone does not match');
  END IF;
  IF _type NOT IN ('cancel','revision') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid request type');
  END IF;
  IF lower(o.status) IN ('delivered','cancelled') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This order can no longer be changed');
  END IF;
  IF EXISTS (SELECT 1 FROM public.order_requests r WHERE r.order_number = _order_number AND r.status = 'pending') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'A request for this order is already pending');
  END IF;

  INSERT INTO public.order_requests (order_id, order_number, customer_phone, customer_name, type, reason, details)
  VALUES (o.id, o.order_number, o.customer_phone, o.customer_name, _type, _reason, _details)
  RETURNING id INTO new_id;

  PERFORM public.log_order_event(o.id, 'customer_request',
    'Customer submitted a ' || _type || ' request', jsonb_build_object('reason', _reason, 'details', _details));

  RETURN jsonb_build_object('ok', true, 'id', new_id);
END; $$;

GRANT EXECUTE ON FUNCTION public.submit_order_request(text, text, text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_order_requests(_order_number text, _phone text)
RETURNS SETOF public.order_requests
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT r.* FROM public.order_requests r
  JOIN public.orders o ON o.order_number = r.order_number
  WHERE r.order_number = _order_number
    AND regexp_replace(coalesce(o.customer_phone,''), '\D', '', 'g') = regexp_replace(coalesce(_phone,''), '\D', '', 'g');
$$;

GRANT EXECUTE ON FUNCTION public.list_order_requests(text, text) TO anon, authenticated;

-- 2. WhatsApp status notification templates
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  status text PRIMARY KEY,
  message text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage whatsapp templates" ON public.whatsapp_templates;
CREATE POLICY "admins manage whatsapp templates" ON public.whatsapp_templates
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.whatsapp_templates (status, message) VALUES
 ('pending', 'প্রিয় {{name}}, আপনার অর্ডার #{{order_number}} (৳{{total}}) আমরা পেয়েছি ✅ শীঘ্রই কনফার্ম করা হবে। ট্র্যাক করুন: {{track_url}}'),
 ('processing', 'প্রিয় {{name}}, আপনার অর্ডার #{{order_number}} কনফার্ম হয়েছে এবং প্রসেসিং চলছে 📦 ট্র্যাক করুন: {{track_url}}'),
 ('shipped', 'প্রিয় {{name}}, আপনার অর্ডার #{{order_number}} কুরিয়ারে পাঠানো হয়েছে 🚚 কুরিয়ার: {{courier}} | ট্র্যাকিং: {{tracking}} | {{track_url}}'),
 ('delivered', 'প্রিয় {{name}}, আপনার অর্ডার #{{order_number}} ডেলিভারি সম্পন্ন হয়েছে 🎉 ধন্যবাদ আমাদের সাথে থাকার জন্য! ইনভয়েস: {{track_url}}'),
 ('cancelled', 'প্রিয় {{name}}, দুঃখিত — আপনার অর্ডার #{{order_number}} বাতিল করা হয়েছে ❌ বিস্তারিত জানতে আমাদের সাথে যোগাযোগ করুন।')
ON CONFLICT (status) DO NOTHING;

-- 3. Default AI model configuration row
INSERT INTO public.ai_assistant_configs (id, content)
VALUES ('ai_model', '{"provider":"lovable","model":"google/gemini-2.5-flash","base_url":"","api_key":"","temperature":0.3}'::jsonb)
ON CONFLICT (id) DO NOTHING;