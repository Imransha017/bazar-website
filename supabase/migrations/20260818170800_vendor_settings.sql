-- Vendor notification preferences
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"low_stock_app": true, "low_stock_email": false}'::jsonb;

-- Admin-configurable global settings table (for badge criteria etc)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default top vendor badge criteria
INSERT INTO public.app_settings (key, value)
VALUES ('top_vendor_criteria', '{"min_orders": 50, "min_rating": 4.5, "days_window": 30}')
ON CONFLICT (key) DO NOTHING;

GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
