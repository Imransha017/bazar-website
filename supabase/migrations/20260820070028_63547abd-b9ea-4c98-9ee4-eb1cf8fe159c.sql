CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid());

ALTER TABLE public.dropshippers ADD COLUMN IF NOT EXISTS store_slug TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS public.dropshipper_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dropshipper_id UUID REFERENCES public.dropshippers(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (dropshipper_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dropshipper_products TO authenticated;
GRANT ALL ON public.dropshipper_products TO service_role;
ALTER TABLE public.dropshipper_products ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.dropshipper_products TO anon;
CREATE POLICY "Public read dropshipper_products" ON public.dropshipper_products FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Dropshippers can manage their own products" ON public.dropshipper_products FOR ALL TO authenticated USING (dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid()));
