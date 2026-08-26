REVOKE ALL ON FUNCTION public.my_dropshipper_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_dropshipper_ids() TO authenticated;