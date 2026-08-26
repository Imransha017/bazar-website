-- Storefront tables have public read policies; the API role also needs table-level SELECT.
GRANT SELECT ON public.affiliate_settings, public.affiliates, public.ai_assistant_configs,
  public.app_settings, public.banners, public.categories, public.dropshipper_products,
  public.dropshipper_short_links, public.dropshippers, public.dropshipping_announcements,
  public.dropshipping_settings, public.product_marketing_assets, public.product_video_reviews,
  public.products, public.promotions, public.reviews, public.site_settings, public.vendors
TO anon;

-- Coupons stay closed to anonymous reads (no code enumeration); validation keeps
-- working through the validate_coupon function.
REVOKE SELECT ON public.coupons FROM anon;
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;
DROP POLICY IF EXISTS "public read active coupons" ON public.coupons;