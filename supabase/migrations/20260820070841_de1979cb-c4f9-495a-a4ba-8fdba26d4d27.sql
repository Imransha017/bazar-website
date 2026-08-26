-- Fix notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS audience TEXT;

-- Fix Dropshipping support tickets message issue
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';

-- Fix vendor_notifications table
CREATE TABLE IF NOT EXISTS public.vendor_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_notifications TO authenticated;
GRANT ALL ON public.vendor_notifications TO service_role;
ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;
