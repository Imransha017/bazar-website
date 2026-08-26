
-- 1. Visibility mode for dropshippers and products
ALTER TABLE public.dropshippers ADD COLUMN IF NOT EXISTS visibility_mode TEXT DEFAULT 'public' CHECK (visibility_mode IN ('public', 'private'));
ALTER TABLE public.dropshipper_products ADD COLUMN IF NOT EXISTS visibility_mode TEXT DEFAULT 'public' CHECK (visibility_mode IN ('public', 'private'));

-- 2. User Roles Expansion
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'moderator') THEN
        ALTER TYPE public.app_role ADD VALUE 'moderator';
    END IF;
END $$;

-- 3. Wishlist Table
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, product_id)
);

GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wishlists' AND policyname = 'Users manage own wishlist') THEN
        CREATE POLICY "Users manage own wishlist" ON public.wishlists
            FOR ALL TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Recent Views Table
CREATE TABLE IF NOT EXISTS public.recent_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, product_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recent_views TO authenticated;
GRANT ALL ON public.recent_views TO service_role;
ALTER TABLE public.recent_views ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recent_views' AND policyname = 'Users manage own recent views') THEN
        CREATE POLICY "Users manage own recent views" ON public.recent_views
            FOR ALL TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Helper for Personal Store visibility
CREATE OR REPLACE VIEW public.dropshipper_products_view AS
SELECT 
    dp.*,
    p.name as product_name,
    p.image as product_image,
    p.price as base_price,
    p.category_slug,
    p.subcategory_slug,
    p.is_active as product_active
FROM public.dropshipper_products dp
JOIN public.products p ON dp.product_id = p.id
WHERE dp.is_active = true AND p.is_active = true;

GRANT SELECT ON public.dropshipper_products_view TO anon, authenticated;
