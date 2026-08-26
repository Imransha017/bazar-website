DO $$
DECLARE
    wf_id UUID;
    mf_id UUID;
    wbj_id UUID;
    mb_id UUID;
    hl_id UUID;
    ed_id UUID;
    tva_id UUID;
    ea_id UUID;
    hb_id UUID;
    gp_id UUID;
    so_id UUID;
    am_id UUID;
BEGIN
    SELECT id INTO wf_id FROM public.categories WHERE slug = 'womens-fashion';
    SELECT id INTO mf_id FROM public.categories WHERE slug = 'mens-fashion';
    SELECT id INTO wbj_id FROM public.categories WHERE slug = 'watches-bags-jewellery';
    SELECT id INTO mb_id FROM public.categories WHERE slug = 'mother-baby';
    SELECT id INTO hl_id FROM public.categories WHERE slug = 'home-lifestyle';
    SELECT id INTO ed_id FROM public.categories WHERE slug = 'electronic-devices';
    SELECT id INTO tva_id FROM public.categories WHERE slug = 'tv-home-appliances';
    SELECT id INTO ea_id FROM public.categories WHERE slug = 'electronic-accessories';
    SELECT id INTO hb_id FROM public.categories WHERE slug = 'health-beauty';
    SELECT id INTO gp_id FROM public.categories WHERE slug = 'groceries-pets';
    SELECT id INTO so_id FROM public.categories WHERE slug = 'sports-outdoor';
    SELECT id INTO am_id FROM public.categories WHERE slug = 'automotive-motorbike';

    INSERT INTO public.categories (name, slug, parent_id) VALUES
    ('Polo Shirts', 'mens-fashion-polo', mf_id),
    ('Shorts', 'mens-fashion-shorts', mf_id),
    ('Traditional Wear', 'mens-fashion-traditional', mf_id),
    ('Innerwear & Sleepwear', 'mens-fashion-innerwear', mf_id),
    ('Sneakers', 'mens-fashion-sneakers', mf_id),
    ('Sandals & Flip-Flops', 'mens-fashion-flipflops', mf_id)
    ON CONFLICT (slug) DO NOTHING;

    INSERT INTO public.categories (name, slug, parent_id) VALUES
    ('Baby Feeding', 'mb-feeding', mb_id),
    ('Milk Formula', 'mb-milk-formula', mb_id),
    ('Baby Personal Care', 'mb-baby-care', mb_id),
    ('Baby Gear', 'mb-gear', mb_id),
    ('Maternity Care', 'mb-maternity', mb_id),
    ('Educational Toys', 'mb-educational-toys', mb_id)
    ON CONFLICT (slug) DO NOTHING;

    INSERT INTO public.categories (name, slug, parent_id) VALUES
    ('Mobile Accessories', 'ea-mobile-acc', ea_id),
    ('Phone Cases', 'ea-phone-cases', ea_id),
    ('Screen Protectors', 'ea-screen-prot', ea_id),
    ('Bluetooth Speakers', 'ea-bt-speakers', ea_id),
    ('Wearable Accessories', 'ea-wearable-acc', ea_id),
    ('Camera Accessories', 'ea-camera-acc', ea_id),
    ('Storage & Memory', 'ea-storage', ea_id),
    ('Computer Accessories', 'ea-computer-acc', ea_id),
    ('Networking Devices', 'ea-networking', ea_id),
    ('Gaming Accessories', 'ea-gaming-acc', ea_id)
    ON CONFLICT (slug) DO NOTHING;

    INSERT INTO public.categories (name, slug, parent_id) VALUES
    ('Fragrances', 'hb-fragrances', hb_id),
    ('Bath & Body', 'hb-bath-body', hb_id),
    ('Men''s Grooming', 'hb-mens-grooming', hb_id),
    ('Beauty Tools', 'hb-beauty-tools', hb_id),
    ('Health Supplements', 'hb-supplements', hb_id),
    ('Medical Supplies', 'hb-medical', hb_id),
    ('Sexual Wellness', 'hb-sexual-wellness', hb_id),
    ('Oral Care', 'hb-oral-care', hb_id)
    ON CONFLICT (slug) DO NOTHING;
END $$;
