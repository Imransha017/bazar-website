-- Categories updates
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id);
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Products updates
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- Banners updates
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS placement TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS button_label TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS button_link TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS gradient_from TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS gradient_to TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Reviews updates
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

-- Dropshippers updates
ALTER TABLE public.dropshippers ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- Add password_reset_requests table
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_reset_requests TO authenticated;
GRANT ALL ON public.password_reset_requests TO service_role;
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Add analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT INSERT ON public.analytics_events TO authenticated, anon;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Add admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    action TEXT NOT NULL,
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT SELECT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Update RLS for all tables (Allowing authenticated users for demo purposes)
CREATE POLICY "Authenticated users can select everything" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select everything" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select everything" ON public.banners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select everything" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select everything" ON public.vendors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select everything" ON public.dropshippers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select everything" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select everything" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- Anon access for public storefront
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.banners TO anon;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.vendors TO anon;
GRANT SELECT ON public.dropshippers TO anon;

CREATE POLICY "Public read categories" ON public.categories FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read products" ON public.products FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read banners" ON public.banners FOR SELECT TO anon USING (active = true);
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT TO anon USING (is_approved = true);
