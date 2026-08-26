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
    END IF;
    -- 2. Men's Fashion deep options
    SELECT id INTO parent_id_var FROM public.categories WHERE name = 'Men''s Fashion' AND parent_id IS NULL LIMIT 1;
    IF parent_id_var IS NOT NULL THEN
        INSERT INTO public.categories (name, slug, parent_id) VALUES ('Clothing', 'mens-clothing', parent_id_var) ON CONFLICT (slug) DO NOTHING;
        SELECT id INTO sub_id_var FROM public.categories WHERE slug = 'mens-clothing' LIMIT 1;
        IF sub_id_var IS NOT NULL THEN
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('T-Shirts', 'mens-t-shirts', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Polo Shirts', 'mens-polo-shirts', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Jeans', 'mens-jeans', sub_id_var) ON CONFLICT (slug) DO NOTHING;
        END IF;
    END IF;
    -- 3. Electronic Devices deep options
    SELECT id INTO parent_id_var FROM public.categories WHERE name = 'Electronic Devices' AND parent_id IS NULL LIMIT 1;
    IF parent_id_var IS NOT NULL THEN
        INSERT INTO public.categories (name, slug, parent_id) VALUES ('Mobiles', 'mobiles', parent_id_var) ON CONFLICT (slug) DO NOTHING;
        SELECT id INTO sub_id_var FROM public.categories WHERE slug = 'mobiles' LIMIT 1;
        IF sub_id_var IS NOT NULL THEN
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Smartphones', 'smartphones', sub_id_var) ON CONFLICT (slug) DO NOTHING;
            INSERT INTO public.categories (name, slug, parent_id) VALUES ('Feature Phones', 'feature-phones', sub_id_var) ON CONFLICT (slug) DO NOTHING;
        END IF;
    END IF;
END $$;
