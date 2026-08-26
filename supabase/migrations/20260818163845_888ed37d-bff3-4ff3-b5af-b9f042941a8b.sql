-- Admin Notifications and Error Logs
CREATE TABLE public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'error', 'system', 'build'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notifications"
ON public.admin_notifications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL, -- 'client', 'server'
    error_type TEXT,
    message TEXT,
    stack TEXT,
    url TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT INSERT ON public.error_logs TO authenticated;
GRANT INSERT ON public.error_logs TO anon;
GRANT SELECT ON public.error_logs TO authenticated;
GRANT ALL ON public.error_logs TO service_role;

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert logs"
ON public.error_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view logs"
ON public.error_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));