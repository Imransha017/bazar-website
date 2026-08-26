CREATE TABLE IF NOT EXISTS public.product_video_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dropshipper_id UUID REFERENCES public.dropshippers(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    video_url TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('youtube', 'facebook')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_video_reviews TO authenticated;
GRANT ALL ON public.product_video_reviews TO service_role;
ALTER TABLE public.product_video_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dropshippers can manage their own video reviews" ON public.product_video_reviews
FOR ALL TO authenticated
USING (dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.dropshipper_short_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dropshipper_id UUID REFERENCES public.dropshippers(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    alias TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dropshipper_short_links TO authenticated;
GRANT ALL ON public.dropshipper_short_links TO service_role;
ALTER TABLE public.dropshipper_short_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dropshippers can manage their own short links" ON public.dropshipper_short_links
FOR ALL TO authenticated
USING (dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid()));

ALTER TABLE public.dropshippers ADD COLUMN IF NOT EXISTS facebook_shop_config JSONB DEFAULT '{}';
