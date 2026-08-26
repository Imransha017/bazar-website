-- Ensure unique constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_slug_unique') THEN
        ALTER TABLE public.products ADD CONSTRAINT products_slug_unique UNIQUE (slug);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_slug_unique') THEN
        ALTER TABLE public.categories ADD CONSTRAINT categories_slug_unique UNIQUE (slug);
    END IF;
END
$$;

-- Ensure system vendor exists
INSERT INTO public.vendors (id, name, email, slug)
VALUES ('00000000-0000-0000-0000-000000000000', 'System Store', 'system@example.com', 'system-store')
ON CONFLICT (id) DO NOTHING;

-- Seed categories
INSERT INTO public.categories (name, slug, sort_order)
VALUES 
('Electronics', 'electronics', 1),
('Fashion', 'fashion', 2),
('Home & Garden', 'home-garden', 3)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Seed products
INSERT INTO public.products (name, slug, price, original_price, vendor_id, category_slug, category_name, is_active, image, stock_quantity)
VALUES 
('Xiaomi Redmi 13', 'xiaomi-redmi-13', 15000, 18000, '00000000-0000-0000-0000-000000000000', 'electronics', 'Electronics', true, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9', 100),
('Denim Jeans', 'denim-jeans', 1200, 2000, '00000000-0000-0000-0000-000000000000', 'fashion', 'Fashion', true, 'https://images.unsplash.com/photo-1542272604-787c3835535d', 50),
('Electric Kettle', 'electric-kettle', 800, 1200, '00000000-0000-0000-0000-000000000000', 'electronics', 'Electronics', true, 'https://images.unsplash.com/photo-1594212699903-ec8a3ecc50f6', 30)
ON CONFLICT (slug) DO UPDATE SET 
    price = EXCLUDED.price, 
    original_price = EXCLUDED.original_price,
    is_active = EXCLUDED.is_active,
    image = EXCLUDED.image;

-- GRANT permissions
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.vendors TO anon, authenticated;
