-- 1. Create stock_logs table for audit trail
CREATE TABLE public.stock_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    change_amount INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reason TEXT NOT NULL, -- e.g., 'order_placed', 'order_cancelled', 'manual_adjustment'
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT ON public.stock_logs TO authenticated;
GRANT ALL ON public.stock_logs TO service_role;

ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all stock logs"
ON public.stock_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Create stock_reconciliation_reports for periodic checks
CREATE TABLE public.stock_reconciliation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date TIMESTAMPTZ DEFAULT now(),
    total_products INT NOT NULL,
    mismatches_found INT DEFAULT 0,
    details JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id)
);

GRANT SELECT ON public.stock_reconciliation_reports TO authenticated;
GRANT ALL ON public.stock_reconciliation_reports TO service_role;

ALTER TABLE public.stock_reconciliation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reconciliation reports"
ON public.stock_reconciliation_reports
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Update restock_on_cancel_refund to include logging
CREATE OR REPLACE FUNCTION public.restock_on_cancel_refund()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE 
  it jsonb; 
  pid uuid; 
  q int; 
  old_s text; 
  new_s text;
  old_stock int;
BEGIN
  old_s := lower(COALESCE(OLD.status, ''));
  new_s := lower(COALESCE(NEW.status, ''));
  
  IF new_s = old_s THEN RETURN NEW; END IF;
  
  -- Only restock when transitioning INTO cancelled/refunded from a non-restocked state
  IF new_s NOT IN ('cancelled','canceled','refunded') THEN RETURN NEW; END IF;
  IF old_s IN ('cancelled','canceled','refunded','failed') THEN RETURN NEW; END IF;

  IF jsonb_typeof(NEW.items) = 'array' THEN
    FOR it IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
      pid := NULLIF(it->>'id','')::uuid;
      q := GREATEST(COALESCE((it->>'qty')::int, 1), 1);
      IF pid IS NOT NULL THEN
        -- Get current stock before update for logging
        SELECT stock INTO old_stock FROM public.products WHERE id = pid;
        
        UPDATE public.products
           SET stock = stock + q
         WHERE id = pid AND stock < 999999;
         
        -- Log the restock
        INSERT INTO public.stock_logs (product_id, order_id, change_amount, previous_stock, new_stock, reason)
        VALUES (pid, NEW.id, q, old_stock, old_stock + q, 'order_' || new_s);
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END; $function$;

-- 4. Update place_order to include logging
CREATE OR REPLACE FUNCTION public.place_order(_payload jsonb)
 RETURNS TABLE(id uuid, order_number text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
  new_num text;
  uid uuid := auth.uid();
  it jsonb;
  pid uuid;
  q int;
  initial_status text := 'pending';
  pay_status text;
  v_total numeric;
  v_paid numeric;
  old_stock int;
BEGIN
  IF _payload IS NULL THEN RAISE EXCEPTION 'payload required'; END IF;

  IF COALESCE(_payload->>'customer_name','') = '' OR
     COALESCE(_payload->>'customer_phone','') = '' OR
     COALESCE(_payload->>'address','') = '' THEN
    RAISE EXCEPTION 'missing required fields';
  END IF;

  IF jsonb_typeof(_payload->'items') <> 'array' OR jsonb_array_length(_payload->'items') = 0 THEN
    RAISE EXCEPTION 'items required';
  END IF;

  v_total := COALESCE((_payload->>'total')::numeric, 0);
  v_paid := COALESCE((_payload->>'paid_amount')::numeric, 0);
  pay_status := lower(COALESCE(NULLIF(_payload->>'payment_status',''), 'pending'));

  IF pay_status IN ('failed','declined','error') THEN
    initial_status := 'failed';
  ELSIF pay_status IN ('cancelled','canceled','voided') THEN
    initial_status := 'cancelled';
  ELSIF (_payload->>'payment_method' IN ('bkash','nagad','rocket')) AND (NULLIF(_payload->>'txn_id','') IS NOT NULL) THEN
    IF v_paid >= v_total AND v_total > 0 THEN
      initial_status := 'completed';
      pay_status := 'paid';
    ELSE
      initial_status := 'processing';
    END IF;
  END IF;

  INSERT INTO public.orders (
    customer_name, customer_phone, customer_email, address, district, thana,
    items, subtotal, delivery_fee, total, payment_method, payment_type,
    txn_id, sender_phone, paid_amount, status, payment_status, notes, vendor_id, user_id
  ) VALUES (
    _payload->>'customer_name', _payload->>'customer_phone',
    NULLIF(_payload->>'customer_email',''), _payload->>'address',
    NULLIF(_payload->>'district',''), NULLIF(_payload->>'thana',''),
    COALESCE(_payload->'items','[]'::jsonb),
    COALESCE((_payload->>'subtotal')::numeric, 0),
    COALESCE((_payload->>'delivery_fee')::numeric, 0),
    v_total,
    COALESCE(_payload->>'payment_method','cod'),
    NULLIF(_payload->>'payment_type',''), NULLIF(_payload->>'txn_id',''),
    NULLIF(_payload->>'sender_phone',''),
    v_paid,
    initial_status,
    pay_status,
    NULLIF(_payload->>'notes',''),
    NULLIF(_payload->>'vendor_id','')::uuid, uid
  )
  RETURNING orders.id, orders.order_number INTO new_id, new_num;

  -- Stock deduction ONLY if not failed/cancelled
  IF initial_status NOT IN ('failed','cancelled') THEN
    FOR it IN SELECT * FROM jsonb_array_elements(_payload->'items') LOOP
      pid := NULLIF(it->>'id','')::uuid;
      q := GREATEST(COALESCE((it->>'qty')::int, 1), 1);
      IF pid IS NOT NULL THEN
        -- Get current stock before update for logging
        SELECT stock INTO old_stock FROM public.products WHERE id = pid;
        
        UPDATE public.products p
           SET stock = GREATEST(p.stock - q, 0)
         WHERE p.id = pid AND p.stock < 999999 AND p.stock > 0;
         
        -- Log the deduction
        INSERT INTO public.stock_logs (product_id, order_id, change_amount, previous_stock, new_stock, reason)
        VALUES (pid, new_id, -q, old_stock, GREATEST(old_stock - q, 0), 'order_placed');
      END IF;
    END LOOP;
  ELSE
    -- Log that stock was NOT deducted due to failed/cancelled status
    FOR it IN SELECT * FROM jsonb_array_elements(_payload->'items') LOOP
      pid := NULLIF(it->>'id','')::uuid;
      IF pid IS NOT NULL THEN
        INSERT INTO public.stock_logs (product_id, order_id, change_amount, previous_stock, new_stock, reason)
        VALUES (pid, new_id, 0, 0, 0, 'stock_skip_' || initial_status);
      END IF;
    END LOOP;
  END IF;

  place_order.id := new_id;
  place_order.order_number := new_num;
  RETURN NEXT;
END; $function$;