-- Clear existing categories to avoid duplicates or mess
TRUNCATE public.categories CASCADE;

-- Insert Main Categories
-- We'll use UUIDs for parent-child relationship
DO $$
DECLARE
    wf_id UUID := gen_random_uuid();
    mf_id UUID := gen_random_uuid();
    wbj_id UUID := gen_random_uuid();
    mb_id UUID := gen_random_uuid();
    hl_id UUID := gen_random_uuid();
    ed_id UUID := gen_random_uuid();
    tva_id UUID := gen_random_uuid();
    ea_id UUID := gen_random_uuid();
    hb_id UUID := gen_random_uuid();
    gp_id UUID := gen_random_uuid();
    so_id UUID := gen_random_uuid();
    am_id UUID := gen_random_uuid();
BEGIN
    -- 1. Women's Fashion
    INSERT INTO public.categories (id, name, slug, icon, sort_order)
    VALUES (wf_id, 'Women''s Fashion', 'womens-fashion', '👗', 1);
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
    ('Muslim Wear', 'womens-fashion-muslim-wear', wf_id),
    ('Sarees', 'womens-fashion-sarees', wf_id),
    ('Salwar Kameez', 'womens-fashion-salwar-kameez', wf_id),
    ('Kurtis & Tunics', 'womens-fashion-kurtis-tunics', wf_id),
    ('Tops', 'womens-fashion-tops', wf_id),
    ('Dresses', 'womens-fashion-dresses', wf_id),
    ('Traditional Wear', 'womens-fashion-traditional', wf_id),
    ('Winter Clothing', 'womens-fashion-winter', wf_id),
    ('Lingerie & Sleepwear', 'womens-fashion-lingerie', wf_id),
    ('Shoes', 'womens-fashion-shoes', wf_id),
    ('Sandals', 'womens-fashion-sandals', wf_id),
    ('Sportswear', 'womens-fashion-sportswear', wf_id),
    ('Accessories', 'womens-fashion-accessories', wf_id);

    -- 2. Men's Fashion
    INSERT INTO public.categories (id, name, slug, icon, sort_order)
    VALUES (mf_id, 'Men''s Fashion', 'mens-fashion', '👔', 2);
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
    ('T-Shirts', 'mens-fashion-t-shirts', mf_id),
    ('Shirts', 'mens-fashion-shirts', mf_id),
    ('Pants', 'mens-fashion-pants', mf_id),
    ('Jeans', 'mens-fashion-jeans', mf_id),
    ('Panjabi', 'mens-fashion-panjabi', mf_id),
    ('Shoes', 'mens-fashion-shoes', mf_id),
    ('Accessories', 'mens-fashion-accessories', mf_id);

    -- 3. Watches, Bags & Jewellery
    INSERT INTO public.categories (id, name, slug, icon, sort_order)
    VALUES (wbj_id, 'Watches, Bags & Jewellery', 'watches-bags-jewellery', '⌚', 3);
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
    ('Men''s Watches', 'mens-watches', wbj_id),
    ('Women''s Watches', 'womens-watches', wbj_id),
    ('Bags', 'bags', wbj_id),
    ('Jewellery', 'jewellery', wbj_id);

    -- 4. Mother & Baby
    INSERT INTO public.categories (id, name, slug, icon, sort_order)
    VALUES (mb_id, 'Mother & Baby', 'mother-baby', '🍼', 4);
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
    ('Diapers', 'diapers', mb_id),
    ('Baby Clothing', 'baby-clothing', mb_id),
    ('Toys', 'baby-toys', mb_id);

    -- 5. Home & Lifestyle
    INSERT INTO public.categories (id, name, slug, icon, sort_order)
    VALUES (hl_id, 'Home & Lifestyle', 'home-lifestyle', '🏠', 5);
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
    ('Kitchen', 'home-kitchen', hl_id),
    ('Bedding', 'home-bedding', hl_id),
    ('Furniture', 'home-furniture', hl_id);

    -- 6. Electronic Devices
    INSERT INTO public.categories (id, name, slug, icon, sort_order)
    VALUES (ed_id, 'Electronic Devices', 'electronic-devices', '💻', 6);
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
    ('Mobiles', 'mobiles', ed_id),
    ('Laptops', 'laptops', ed_id),
    ('Tablets', 'tablets', ed_id);

    -- 7. TV & Home Appliances
    INSERT INTO public.categories (id, name, slug, icon, sort_order)
    VALUES (tva_id, 'TV & Home Appliances', 'tv-home-appliances', '📺', 7);
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
    ('Televisions', 'televisions', tva_id),
    ('Air Conditioners', 'ac', tva_id),
    ('Refrigerators', 'fridges', tva_id);

    -- 8. Electronic Accessories
    INSERT INTO public.categories (id, name, slug, icon, sort_order)
    VALUES (ea_id, 'Electronic Accessories', 'electronic-accessories', '🎧', 8);
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
    ('Headphones', 'headphones', ea_id),
    ('Smartwatches', 'smartwatches', ea_id),
    ('Power Banks', 'power-banks', ea_id);

    -- 9. Health & Beauty
    INSERT INTO public.categories (id, name, slug, icon, sort_order)
    VALUES (hb_id, 'Health & Beauty', 'health-beauty', '💄', 9);
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
    ('Skincare', 'skincare', hb_id),
    ('Makeup', 'makeup', hb_id),
    ('Haircare', 'haircare', hb_id);

    -- 10. Groceries & Pets
    INSERT INTO public.categories (id, name, slug, icon, sort_order)
    VALUES (gp_id, 'Groceries & Pets', 'groceries-pets', '🛒', 10);
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
    ('Breakfast', 'breakfast', gp_id),
    ('Pet Supplies', 'pet-supplies', gp_id);

    -- 11. Sports & Outdoor
    INSERT INTO public.categories (id, name, slug, icon, sort_order)
    VALUES (so_id, 'Sports & Outdoor', 'sports-outdoor', '⚽', 11);
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
    ('Exercise', 'exercise', so_id),
    ('Team Sports', 'team-sports', so_id);

    -- 12. Automotive & Motorbike
    INSERT INTO public.categories (id, name, slug, icon, sort_order)
    VALUES (am_id, 'Automotive & Motorbike', 'automotive-motorbike', '🚗', 12);
    
    INSERT INTO public.categories (name, slug, parent_id) VALUES
    ('Car Accessories', 'car-accessories', am_id),
    ('Motorcycle Accessories', 'moto-accessories', am_id);

END $$;

-- Grant permissions again to be safe
GRANT SELECT ON public.categories TO anon, authenticated;
