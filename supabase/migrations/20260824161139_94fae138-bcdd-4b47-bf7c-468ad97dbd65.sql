CREATE SCHEMA IF NOT EXISTS mig;
CREATE OR REPLACE FUNCTION mig.bootstrap_exec(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
REVOKE ALL ON FUNCTION mig.bootstrap_exec(text) FROM PUBLIC;
GRANT USAGE ON SCHEMA mig TO service_role;
GRANT EXECUTE ON FUNCTION mig.bootstrap_exec(text) TO service_role;
DROP FUNCTION IF EXISTS public.__migration_bootstrap_exec(text);