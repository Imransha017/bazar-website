-- Notifications table updates
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS audience TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- password_reset_requests updates
ALTER TABLE public.password_reset_requests ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE public.password_reset_requests ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.password_reset_requests ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- vendors updates
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS vendors_slug_idx ON public.vendors (slug);

-- support_messages sender info
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS sender_name TEXT; -- Just in case it's used
