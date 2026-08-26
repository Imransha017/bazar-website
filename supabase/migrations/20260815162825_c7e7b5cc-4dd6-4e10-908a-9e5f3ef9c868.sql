DROP VIEW IF EXISTS public.dropshippers_public;
CREATE VIEW public.dropshippers_public AS
SELECT
  id,
  code,
  store_name,
  store_slug,
  logo_url,
  banner_url,
  bio,
  status
FROM public.dropshippers;

GRANT SELECT ON public.dropshippers_public TO anon, authenticated;
GRANT ALL ON public.dropshippers_public TO service_role;