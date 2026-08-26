-- Ensure constraints exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_slug_unique') THEN
        ALTER TABLE public.products ADD CONSTRAINT products_slug_unique UNIQUE (slug);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_slug_unique') THEN
        ALTER TABLE public.categories ADD CONSTRAINT categories_slug_unique UNIQUE (slug);
    END IF;
END $$;

-- Create a system vendor if none exists
INSERT INTO public.vendors (id, user_id, store_name, status, store_slug)
SELECT '00000000-0000-0000-0000-000000000000', '3aa72d4b-8a75-44de-8995-a8b6ff1d04a7', 'System Store', 'approved', 'system-store'
ON CONFLICT (id) DO NOTHING;

-- Seed Categories
INSERT INTO public.categories (name, slug, icon, sort_order) VALUES 
('Electronics', 'electronics', '📱', 1), 
('Fashion', 'fashion-women', '👗', 2), 
('Home & Garden', 'home', '🏠', 3) 
ON CONFLICT (slug) DO NOTHING;

-- Seed Products
INSERT INTO public.products (name, slug, category_slug, category_name, price, original_price, image, is_active, stock_quantity, description, vendor_id) VALUES 
('Xiaomi Redmi 13', 'redmi-13', 'electronics', 'Electronics', 18999, 19999, 'https://loremflickr.com/400/400/smartphone,redmi?lock=1', true, 100, 'Powerful smartphone with great camera', '00000000-0000-0000-0000-000000000000'), 
('Denim Jeans', 'denim-jeans', 'fashion-women', 'Fashion', 1599, 1899, 'https://loremflickr.com/400/400/jeans?lock=2', true, 50, 'Comfortable slim fit denim jeans', '00000000-0000-0000-0000-000000000000'), 
('Electric Kettle', 'electric-kettle', 'home', 'Home & Garden', 1199, 1399, 'https://loremflickr.com/400/400/kettle?lock=3', true, 30, 'Fast boiling 1.8L electric kettle', '00000000-0000-0000-0000-000000000000') 
ON CONFLICT (slug) DO NOTHING;