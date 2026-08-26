CREATE TABLE public.order_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    event_type text NOT NULL, -- 'attribution', 'rls_check', 'sync_error', etc.
    severity text NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error'
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    actor_id uuid, -- auth.uid() if applicable
    created_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.order_audit_logs TO authenticated;
GRANT INSERT ON public.order_audit_logs TO authenticated;
GRANT ALL ON public.order_audit_logs TO service_role;

ALTER TABLE public.order_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs"
ON public.order_audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view logs for their own orders"
ON public.order_audit_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_audit_logs.order_id
        AND (
            orders.user_id = auth.uid() OR
            orders.vendor_id = auth.uid() OR
            orders.dropshipper_id = auth.uid()
        )
    )
);

CREATE OR REPLACE FUNCTION public.log_order_event(
    _order_id uuid,
    _event_type text,
    _message text,
    _metadata jsonb DEFAULT '{}'::jsonb,
    _severity text DEFAULT 'info'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _log_id uuid;
BEGIN
    INSERT INTO public.order_audit_logs (order_id, event_type, message, metadata, severity, actor_id)
    VALUES (_order_id, _event_type, _message, _metadata, _severity, auth.uid())
    RETURNING id INTO _log_id;
    RETURN _log_id;
END;
$$;