ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image TEXT;

ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS commission_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    label TEXT,
    full_name TEXT,
    phone TEXT,
    district TEXT,
    thana TEXT,
    address TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own addresses" ON public.addresses FOR ALL TO authenticated USING (user_id = auth.uid());
