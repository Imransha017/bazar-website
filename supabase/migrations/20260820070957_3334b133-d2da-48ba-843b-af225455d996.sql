-- Add missing columns to admin_audit_logs
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS actor_id UUID;
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS actor_email TEXT;
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS from_value TEXT;
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS to_value TEXT;
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Correcting log_order_event RPC signature for components
DROP FUNCTION IF EXISTS public.log_order_event(UUID, TEXT, TEXT, JSONB);
CREATE OR REPLACE FUNCTION public.log_order_event(_order_id UUID, _event_type TEXT, _description TEXT DEFAULT NULL, _metadata JSONB DEFAULT NULL, _order_number TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.order_events (order_id, event_type, description, metadata, created_by)
  VALUES (_order_id, _event_type, _description, _metadata, auth.uid());
END;
$$;

-- Fix dropshippers notify_email column type (should be BOOLEAN for the check in notify.server.ts)
ALTER TABLE public.dropshippers DROP COLUMN IF EXISTS notify_email;
ALTER TABLE public.dropshippers ADD COLUMN notify_email BOOLEAN DEFAULT true;

-- Ensure vendors and dropshippers have user_id indexed
CREATE INDEX IF NOT EXISTS vendors_user_id_idx ON public.vendors (user_id);
CREATE INDEX IF NOT EXISTS dropshippers_user_id_idx ON public.dropshippers (user_id);
