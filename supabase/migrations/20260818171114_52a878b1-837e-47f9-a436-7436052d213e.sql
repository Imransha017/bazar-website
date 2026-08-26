ALTER TABLE public.dropshippers 
ADD COLUMN IF NOT EXISTS whatsapp_order_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS real_time_popups_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS theme_color_primary text DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS theme_color_background text DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS theme_layout_style text DEFAULT 'grid';

DROP VIEW IF EXISTS public.dropshippers_public;
CREATE VIEW public.dropshippers_public AS
SELECT 
    id,
    code,
    store_name,
    store_slug,
    logo_url,
    banner_url,
    profile_image_url,
    bio,
    status,
    whatsapp,
    whatsapp_order_enabled,
    real_time_popups_enabled,
    theme_color_primary,
    theme_color_background,
    theme_layout_style
FROM public.dropshippers
WHERE status = 'approved';

GRANT SELECT ON public.dropshippers_public TO anon, authenticated;