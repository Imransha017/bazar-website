-- Add approval status to video reviews
ALTER TABLE public.product_video_reviews 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES auth.users(id);

-- Enhance short link tracking
ALTER TABLE public.dropshipper_short_links
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS cart_adds_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversions_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_clicked_at timestamptz;

-- Tracking logs for granular analytics
CREATE TABLE IF NOT EXISTS public.short_link_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    short_link_id uuid REFERENCES public.dropshipper_short_links(id) ON DELETE CASCADE,
    event_type text NOT NULL CHECK (event_type IN ('click', 'cart_add', 'order')),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Facebook Feed Sync Logs
CREATE TABLE IF NOT EXISTS public.dropshipper_feed_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dropshipper_id uuid REFERENCES public.dropshippers(id) ON DELETE CASCADE,
    last_sync_at timestamptz DEFAULT now(),
    item_count integer DEFAULT 0,
    status text CHECK (status IN ('success', 'error')),
    error_message text,
    created_at timestamptz DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.product_video_reviews TO authenticated;
GRANT ALL ON public.product_video_reviews TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.dropshipper_short_links TO authenticated;
GRANT ALL ON public.dropshipper_short_links TO service_role;

GRANT SELECT, INSERT ON public.short_link_events TO authenticated;
GRANT SELECT, INSERT ON public.short_link_events TO anon;
GRANT ALL ON public.short_link_events TO service_role;

GRANT SELECT, INSERT ON public.dropshipper_feed_logs TO authenticated;
GRANT ALL ON public.dropshipper_feed_logs TO service_role;

-- RLS
ALTER TABLE public.short_link_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropshipper_feed_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dropshippers can view their own feed logs" ON public.dropshipper_feed_logs
    FOR SELECT TO authenticated USING (dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid()));

CREATE POLICY "Short link events are insertable by anyone" ON public.short_link_events
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Dropshippers can view their own events" ON public.short_link_events
    FOR SELECT TO authenticated USING (short_link_id IN (SELECT id FROM public.dropshipper_short_links WHERE dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid())));
