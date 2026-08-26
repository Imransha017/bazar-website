-- Correcting has_role to accept UUID and TEXT as expected by some components
DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Adding place_order RPC stub (implementation logic is usually complex, but we need the signature)
CREATE OR REPLACE FUNCTION public.place_order(_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This is a placeholder for the actual complex order logic
  -- returning a JSON object with id and order_number
  RETURN jsonb_build_object(
    'id', gen_random_uuid(),
    'order_number', 'ORD-' || floor(random() * 1000000)::text
  );
END;
$$;

-- Adding log_order_event RPC stub
CREATE OR REPLACE FUNCTION public.log_order_event(_order_id UUID, _event_type TEXT, _description TEXT DEFAULT NULL, _metadata JSONB DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.order_events (order_id, event_type, description, metadata, created_by)
  VALUES (_order_id, _event_type, _description, _metadata, auth.uid());
END;
$$;

-- Adding lookup_order RPC stub
CREATE OR REPLACE FUNCTION public.lookup_order(_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT row_to_json(o)::jsonb INTO result FROM public.orders o WHERE id = _order_id;
  RETURN result;
END;
$$;

-- Adding admin_get_user_email RPC stub
CREATE OR REPLACE FUNCTION public.admin_get_user_email(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We can't access auth.users directly in simple SQL reliably if not superuser, 
  -- but we can return from profiles if email is synced there, 
  -- or this is often handled by a more privileged server function.
  -- Returning a placeholder or trying to read from a synced table.
  RETURN (SELECT email FROM public.vendors WHERE user_id = _user_id LIMIT 1);
END;
$$;
