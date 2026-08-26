-- Add deep options for sub-categories based on the source site structure
-- We will use the main category name to find the parent_id

DO $$
DECLARE
    parent_id_var uuid;
    sub_id_var uuid;
BEGIN
    -- 1. Women's Fashion deep options
    SELECT id INTO parent_id_var FROM public.categories WHERE name = 'Women''s Fashion' AND parent_id IS NULL LIMIT 1;
    IF parent_id_var IS NOT NULL THEN
        -- Muslim Wear
        INSERT INTO public.categories (name, slug, parent_id) VALUES ('Muslim Wear', 'womens-muslim-wear', parent_id_var) ON CONFLICT (slug) DO NOTHING;
        SELECT id INTO sub_id_var FROM public.categories WHERE slug = 'womens-muslim-wear' LIMIT 1;
        IF sub_id_var IS NOT NULL THEN
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Abayas', 'abayas', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Hijabs', 'hijabs', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Prayer Suits', 'prayer-suits', sub_id_var) ON CONFLICT (slug) DO NOTHING;
        END IF;

        -- Sarees
        INSERT INTO public.categories (name, slug, parent_id) VALUES ('Sarees', 'womens-sarees', parent_id_var) ON CONFLICT (slug) DO NOTHING;
        SELECT id INTO sub_id_var FROM public.categories WHERE slug = 'womens-sarees' LIMIT 1;
        IF sub_id_var IS NOT NULL THEN
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Silk Sarees', 'silk-sarees', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Cotton Sarees', 'cotton-sarees', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Party Wear Sarees', 'party-wear-sarees', sub_id_var) ON CONFLICT (slug) DO NOTHING;
        END IF;

        -- Shoes
        INSERT INTO public.categories (name, slug, parent_id) VALUES ('Shoes', 'womens-shoes', parent_id_var) ON CONFLICT (slug) DO NOTHING;
        SELECT id INTO sub_id_var FROM public.categories WHERE slug = 'womens-shoes' LIMIT 1;
        IF sub_id_var IS NOT NULL THEN
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Heels', 'womens-heels', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Flats', 'womens-flats', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Sneakers', 'womens-sneakers', sub_id_var) ON CONFLICT (slug) DO NOTHING;
        END IF;
    END IF;

    -- 2. Men's Fashion deep options
    SELECT id INTO parent_id_var FROM public.categories WHERE name = 'Men''s Fashion' AND parent_id IS NULL LIMIT 1;
    IF parent_id_var IS NOT NULL THEN
        -- Clothing
        INSERT INTO public.categories (name, slug, parent_id) VALUES ('Clothing', 'mens-clothing', parent_id_var) ON CONFLICT (slug) DO NOTHING;
        SELECT id INTO sub_id_var FROM public.categories WHERE slug = 'mens-clothing' LIMIT 1;
        IF sub_id_var IS NOT NULL THEN
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('T-Shirts', 'mens-t-shirts', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Polo Shirts', 'mens-polo-shirts', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Shirts', 'mens-shirts', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Jeans', 'mens-jeans', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Panjabis', 'mens-panjabis', sub_id_var) ON CONFLICT (slug) DO NOTHING;
        END IF;

        -- Shoes
        INSERT INTO public.categories (name, slug, parent_id) VALUES ('Shoes', 'mens-shoes', parent_id_var) ON CONFLICT (slug) DO NOTHING;
        SELECT id INTO sub_id_var FROM public.categories WHERE slug = 'mens-shoes' LIMIT 1;
        IF sub_id_var IS NOT NULL THEN
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Sneakers', 'mens-sneakers', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Formal Shoes', 'mens-formal-shoes', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Sandals', 'mens-sandals', sub_id_var) ON CONFLICT (slug) DO NOTHING;
        END IF;
    END IF;

    -- 3. Electronic Devices deep options
    SELECT id INTO parent_id_var FROM public.categories WHERE name = 'Electronic Devices' AND parent_id IS NULL LIMIT 1;
    IF parent_id_var IS NOT NULL THEN
        -- Mobiles
        INSERT INTO public.categories (name, slug, parent_id) VALUES ('Mobiles', 'mobiles', parent_id_var) ON CONFLICT (slug) DO NOTHING;
        SELECT id INTO sub_id_var FROM public.categories WHERE slug = 'mobiles' LIMIT 1;
        IF sub_id_var IS NOT NULL THEN
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Smartphones', 'smartphones', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Feature Phones', 'feature-phones', sub_id_var) ON CONFLICT (slug) DO NOTHING;
        END IF;

        -- Laptops
        INSERT INTO public.categories (name, slug, parent_id) VALUES ('Laptops', 'laptops', parent_id_var) ON CONFLICT (slug) DO NOTHING;
        SELECT id INTO sub_id_var FROM public.categories WHERE slug = 'laptops' LIMIT 1;
        IF sub_id_var IS NOT NULL THEN
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Gaming Laptops', 'gaming-laptops', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Ultrabooks', 'ultrabooks', sub_id_var) ON CONFLICT (slug) DO NOTHING;
        END IF;
    END IF;

    -- 4. Electronic Accessories deep options
    SELECT id INTO parent_id_var FROM public.categories WHERE name = 'Electronic Accessories' AND parent_id IS NULL LIMIT 1;
    IF parent_id_var IS NOT NULL THEN
        -- Mobile Accessories
        INSERT INTO public.categories (name, slug, parent_id) VALUES ('Mobile Accessories', 'mobile-accessories', parent_id_var) ON CONFLICT (slug) DO NOTHING;
        SELECT id INTO sub_id_var FROM public.categories WHERE slug = 'mobile-accessories' LIMIT 1;
        IF sub_id_var IS NOT NULL THEN
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Phone Cases', 'phone-cases', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Power Banks', 'power-banks', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Charging Cables', 'charging-cables', sub_id_var) ON CONFLICT (slug) DO NOTHING;
        END IF;

        -- Audio
        INSERT INTO public.categories (name, slug, parent_id) VALUES ('Audio', 'audio-accessories', parent_id_var) ON CONFLICT (slug) DO NOTHING;
        SELECT id INTO sub_id_var FROM public.categories WHERE slug = 'audio-accessories' LIMIT 1;
        IF sub_id_var IS NOT NULL THEN
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Headphones', 'headphones', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Bluetooth Speakers', 'bluetooth-speakers', sub_id_var) ON CONFLICT (slug) DO NOTHING;
        END IF;
    END IF;

END $$;
