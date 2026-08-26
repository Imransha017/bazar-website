ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]';

CREATE TABLE IF NOT EXISTS public.dropshipper_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dropshipper_id UUID REFERENCES public.dropshippers(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dropshipper_clicks TO authenticated;
GRANT ALL ON public.dropshipper_clicks TO service_role;
ALTER TABLE public.dropshipper_clicks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.dropshipper_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dropshipper_id UUID REFERENCES public.dropshippers(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dropshipper_earnings TO authenticated;
GRANT ALL ON public.dropshipper_earnings TO service_role;
ALTER TABLE public.dropshipper_earnings ENABLE ROW LEVEL SECURITY;
