ALTER VIEW public.dropshipper_products_view SET (security_invoker = on);

CREATE OR REPLACE FUNCTION public.lookup_order(_order_number text, _phone text)
RETURNS SETOF public.orders
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.orders
  WHERE order_number = _order_number
    AND customer_phone IS NOT NULL
    AND regexp_replace(customer_phone, '\D', '', 'g') = regexp_replace(coalesce(_phone,''), '\D', '', 'g');
$$;

CREATE OR REPLACE FUNCTION public.admin_get_user_email(_user_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN NULL;
  END IF;
  RETURN (SELECT email FROM public.vendors WHERE user_id = _user_id LIMIT 1);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_user_email(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_user_email(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.log_order_event(uuid, text, text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_order_event(uuid, text, text, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;