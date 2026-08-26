
-- Marketing & Domain Automation Schema

-- 1. Track Pixel Tests & Domain Verification
ALTER TABLE public.dropshippers 
ADD COLUMN IF NOT EXISTS domain_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_pixel_test_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pixel_test_status TEXT;

-- 2. Enhanced Affiliate Tracking (Click Records)
CREATE TABLE IF NOT EXISTS public.dropshipper_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dropshipper_id UUID REFERENCES public.dropshippers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    referer TEXT,
    ip_hash TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT INSERT, SELECT ON public.dropshipper_clicks TO authenticated;
GRANT INSERT ON public.dropshipper_clicks TO anon;
GRANT ALL ON public.dropshipper_clicks TO service_role;
ALTER TABLE public.dropshipper_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record clicks" ON public.dropshipper_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Dropshippers can view their own clicks" ON public.dropshipper_clicks FOR SELECT TO authenticated USING (
    dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid())
);

-- 3. Affiliate Performance View
CREATE OR REPLACE VIEW public.affiliate_performance AS
SELECT 
    d.id as dropshipper_id,
    d.user_id,
    d.parent_dropshipper_id,
    COUNT(DISTINCT c.id) as total_clicks,
    COUNT(DISTINCT e.id) as total_sales,
    COALESCE(SUM(e.profit), 0) as total_profit,
    (SELECT COUNT(*) FROM public.dropshippers WHERE parent_dropshipper_id = d.id) as sub_affiliate_count
FROM public.dropshippers d
LEFT JOIN public.dropshipper_clicks c ON c.dropshipper_id = d.id
LEFT JOIN public.dropshipper_earnings e ON e.dropshipper_id = d.id
GROUP BY d.id, d.user_id, d.parent_dropshipper_id;

GRANT SELECT ON public.affiliate_performance TO authenticated;
GRANT SELECT ON public.affiliate_performance TO service_role;

-- 4. Sub-Affiliate Visibility Policy
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'dropshippers' AND policyname = 'Parents can see sub-affiliate performance'
    ) THEN
        CREATE POLICY "Parents can see sub-affiliate performance" 
        ON public.dropshippers 
        FOR SELECT 
        TO authenticated 
        USING (
            parent_dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid())
        );
    END IF;
END $$;
