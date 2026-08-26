-- ============================================
-- COMPREHENSIVE FIX FOR BAZAR WEBSITE ISSUES
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: ENSURE BANNERS TABLE HAS ALL REQUIRED COLUMNS
-- ============================================
ALTER TABLE public.banners 
ADD COLUMN IF NOT EXISTS button_label TEXT,
ADD COLUMN IF NOT EXISTS button_link TEXT,
ADD COLUMN IF NOT EXISTS gradient_from TEXT NOT NULL DEFAULT 'from-violet-500',
ADD COLUMN IF NOT EXISTS gradient_to TEXT NOT NULL DEFAULT 'to-fuchsia-600';

-- ============================================
-- STEP 2: FIX BANNERS RLS POLICY
-- ============================================
DROP POLICY IF EXISTS "Enable read access for all" ON public.banners;
CREATE POLICY "Enable read access for all" ON public.banners
FOR SELECT TO anon, authenticated
USING (active = true);

-- ============================================
-- STEP 3: SEED CATEGORIES (31 categories)
-- ============================================
INSERT INTO public.categories (name, slug, icon, sort_order) VALUES
  ('Electronics', 'electronics', '📱', 1),
  ('Mobile Phones', 'mobile-phones', '📱', 2),
  ('Laptops & Computers', 'laptops-computers', '💻', 3),
  ('Audio & Headphones', 'audio-headphones', '🎧', 4),
  ('Smart Watches', 'smart-watches', '⌚', 5),
  ('Cameras', 'cameras', '📷', 6),
  ('Gaming', 'gaming', '🎮', 7),
  ('Fashion', 'fashion', '👗', 10),
  ('Men''s Clothing', 'mens-clothing', '👔', 11),
  ('Women''s Clothing', 'womens-clothing', '👗', 12),
  ('Shoes', 'shoes', '👟', 13),
  ('Bags & Accessories', 'bags-accessories', '👜', 14),
  ('Jewelry', 'jewelry', '💍', 15),
  ('Beauty & Personal Care', 'beauty-personal-care', '💄', 20),
  ('Skincare', 'skincare', '🧴', 21),
  ('Makeup', 'makeup', '💄', 22),
  ('Hair Care', 'hair-care', '🧴', 23),
  ('Fragrances', 'fragrances', '🌸', 24),
  ('Health & Wellness', 'health-wellness', '💊', 30),
  ('Vitamins & Supplements', 'vitamins-supplements', '💊', 31),
  ('Home & Kitchen', 'home-kitchen', '🏠', 40),
  ('Furniture', 'furniture', '🛋️', 41),
  ('Kitchen Appliances', 'kitchen-appliances', '🍳', 42),
  ('Home Decor', 'home-decor', '🕯️', 43),
  ('Bedding & Bath', 'bedding-bath', '🛏️', 44),
  ('Sports & Outdoors', 'sports-outdoors', '⚽', 50),
  ('Fitness', 'fitness', '💪', 51),
  ('Outdoor Recreation', 'outdoor-recreation', '🏕️', 52),
  ('Toys & Games', 'toys-games', '🧸', 60),
  ('Baby & Kids', 'baby-kids', '👶', 61),
  ('Automotive', 'automotive', '🚗', 70)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- STEP 4: SEED BANNERS WITH REAL IMAGES
-- ============================================
INSERT INTO public.banners (placement, title, subtitle, image_url, link_url, sort_order, active, button_label, button_link, gradient_from, gradient_to) VALUES
  ('hero_slider', 'Mobile Mega Offer', 'Best deals on smartphones', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1920&q=80', '/category/electronics', 1, true, 'Shop Now', '/category/electronics', 'from-blue-600', 'to-blue-800'),
  ('hero_slider', 'Fashion Bonanza', 'Up to 70% OFF on trendy styles', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80', '/category/fashion', 2, true, 'Explore Fashion', '/category/fashion', 'from-pink-500', 'to-rose-600'),
  ('hero_slider', 'Home Essentials', 'Quality at your budget', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&q=80', '/category/home-kitchen', 3, true, 'Shop Home', '/category/home-kitchen', 'from-amber-500', 'to-orange-600'),
  ('hero_side', 'Audio Fest', 'From ৳499', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', '/category/audio-headphones', 1, true, 'Shop Audio', '/category/audio-headphones', 'from-violet-500', 'to-fuchsia-600'),
  ('hero_side', 'Beauty Week', 'Up to 60% OFF', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80', '/category/beauty-personal-care', 2, true, 'Shop Beauty', '/category/beauty-personal-care', 'from-rose-400', 'to-pink-600')
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 5: ADD ADMIN ROLE FOR ADMIN USER
-- ============================================
DO $$
DECLARE
    admin_email TEXT := 'emransha952@gmail.com';
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
    
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin role assigned to user: %', admin_email;
    ELSE
        RAISE NOTICE 'User with email % not found in auth.users. Please sign up first.', admin_email;
    END IF;
END $$;

-- ============================================
-- STEP 6: USER ROLES RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- STEP 7: PRODUCTS RLS POLICY
-- ============================================
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
CREATE POLICY "Enable read access for all users" ON public.products
FOR SELECT TO anon, authenticated
USING (is_active = true);

-- ============================================
-- STEP 8: CATEGORIES RLS POLICY
-- ============================================
DROP POLICY IF EXISTS "Enable read access for all" ON public.categories;
CREATE POLICY "Enable read access for all" ON public.categories
FOR SELECT TO anon, authenticated
USING (true);

-- ============================================
-- STEP 9: GRANT PERMISSIONS
-- ============================================
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.banners TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- ============================================
-- STEP 10: ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION QUERIES (run these after to verify)
-- ============================================
-- SELECT count(*) FROM public.categories;
-- SELECT count(*) FROM public.banners WHERE active = true;
-- SELECT * FROM public.user_roles WHERE role = 'admin';
-- SELECT * FROM pg_policies WHERE tablename IN ('categories', 'banners', 'products', 'user_roles');