-- Add badge and rating to vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS rating decimal(3,2) DEFAULT 0;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS badge text;

-- Create vendor notifications table
CREATE TABLE IF NOT EXISTS public.vendor_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
    read_at timestamptz,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_notifications TO authenticated;
GRANT ALL ON public.vendor_notifications TO service_role;

ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their own notifications"
ON public.vendor_notifications
FOR SELECT
TO authenticated
USING (
    vendor_id IN (
        SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Vendors can update their own notifications"
ON public.vendor_notifications
FOR UPDATE
TO authenticated
USING (
    vendor_id IN (
        SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
);

-- Trigger for low stock alerts
CREATE OR REPLACE FUNCTION public.check_product_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock < 10 AND (OLD.stock IS NULL OR OLD.stock >= 10) AND NEW.vendor_id IS NOT NULL THEN
        INSERT INTO public.vendor_notifications (vendor_id, title, message, type)
        VALUES (
            NEW.vendor_id,
            'Low Stock Alert: ' || NEW.name,
            'Product "' || NEW.name || '" (SKU: ' || COALESCE(NEW.sku, 'N/A') || ') is low on stock: ' || NEW.stock || ' remaining.',
            'warning'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_product_stock_alert ON public.products;
CREATE TRIGGER tr_product_stock_alert
AFTER UPDATE ON public.products
FOR EACH ROW
WHEN (NEW.stock < 10)
EXECUTE FUNCTION public.check_product_stock_alert();
