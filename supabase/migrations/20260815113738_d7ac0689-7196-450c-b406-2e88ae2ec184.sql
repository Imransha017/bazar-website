CREATE TABLE public.order_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT SELECT, INSERT ON public.order_activities TO authenticated;
GRANT ALL ON public.order_activities TO service_role;

ALTER TABLE public.order_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities for their orders"
    ON public.order_activities
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_activities.order_id
            AND (
                orders.user_id = auth.uid() OR
                orders.vendor_id = (SELECT id FROM public.vendors WHERE user_id = auth.uid()) OR
                orders.dropshipper_id = (SELECT id FROM public.dropshippers WHERE user_id = auth.uid()) OR
                public.has_role(auth.uid(), 'admin')
            )
        )
    );

CREATE OR REPLACE FUNCTION public.log_order_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.status IS DISTINCT FROM NEW.status) THEN
            INSERT INTO public.order_activities (order_id, action, description, metadata)
            VALUES (NEW.id, 'status_change', 'Order status changed from ' || OLD.status || ' to ' || NEW.status, 
                    jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
        END IF;
        
        IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
            INSERT INTO public.order_activities (order_id, action, description, metadata)
            VALUES (NEW.id, 'payment_update', 'Payment status updated to ' || NEW.payment_status, 
                    jsonb_build_object('old_payment_status', OLD.payment_status, 'new_payment_status', NEW.payment_status));
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.order_activities (order_id, action, description)
        VALUES (NEW.id, 'order_placed', 'Order was successfully placed');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_order_activity
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_activity();

-- Seed existing orders
INSERT INTO public.order_activities (order_id, action, description, created_at)
SELECT id, 'order_placed', 'Order was successfully placed', created_at
FROM public.orders;