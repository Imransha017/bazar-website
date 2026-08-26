DROP SCHEMA IF EXISTS public CASCADE;
DROP SCHEMA IF EXISTS mig CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres;
CREATE OR REPLACE FUNCTION public.__mig_exec(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
REVOKE ALL ON FUNCTION public.__mig_exec(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.__mig_exec(text) TO service_role;