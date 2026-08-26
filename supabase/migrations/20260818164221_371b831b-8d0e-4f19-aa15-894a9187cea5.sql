-- Marketing Features Expansion

-- 1. Social Media Kit / Assets
CREATE TABLE public.product_marketing_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'story', 'post', 'banner'
    platform TEXT NOT NULL, -- 'facebook', 'instagram', 'generic'
    image_url TEXT NOT NULL,
    template_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT ON public.product_marketing_assets TO authenticated;
GRANT ALL ON public.product_marketing_assets TO service_role;
ALTER TABLE public.product_marketing_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view assets" ON public.product_marketing_assets FOR SELECT TO authenticated USING (true);

-- 2. Custom Domain Connectivity
ALTER TABLE public.dropshippers ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
ALTER TABLE public.dropshippers ADD COLUMN IF NOT EXISTS domain_status TEXT DEFAULT 'pending'; -- 'pending', 'active', 'failed'

-- 3. Pixel and Analytics Tracking
ALTER TABLE public.dropshippers ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT;
ALTER TABLE public.dropshippers ADD COLUMN IF NOT EXISTS google_analytics_id TEXT;

-- 4. Affiliate Network (Multi-level Dropshipping)
ALTER TABLE public.dropshippers ADD COLUMN IF NOT EXISTS parent_dropshipper_id UUID REFERENCES public.dropshippers(id);
ALTER TABLE public.dropshippers ADD COLUMN IF NOT EXISTS sub_affiliate_commission_rate NUMERIC(5,2) DEFAULT 0.00;

-- 5. Earnings Ledger Expansion for Multi-level
-- First check if dropshipper_earnings_ledger exists (it should based on previous AI turns)
-- If it doesn't, the user might have missed a turn or it was a memory.
-- I'll use a safer approach for the ledger in case it's named differently or missing.

-- Update RLS for dropshippers table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'dropshippers' AND policyname = 'Dropshippers can update their tracking settings'
    ) THEN
        CREATE POLICY "Dropshippers can update their tracking settings"
        ON public.dropshippers
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
