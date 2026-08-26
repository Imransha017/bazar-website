-- Add profile_image_url to dropshippers table
ALTER TABLE public.dropshippers ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Update the public view to include profile_image_url
-- We must match the original order to avoid "cannot change name of view column" errors
CREATE OR REPLACE VIEW public.dropshippers_public AS
SELECT 
    id,
    code,
    store_name,
    store_slug,
    logo_url,
    banner_url,
    bio,
    status,
    profile_image_url
FROM public.dropshippers;

-- Ensure RLS and Grants
GRANT SELECT ON public.dropshippers_public TO anon, authenticated;
