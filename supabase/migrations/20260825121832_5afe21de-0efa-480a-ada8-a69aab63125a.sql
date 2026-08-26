CREATE OR REPLACE FUNCTION public.enforce_profile_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF OLD.is_locked AND NOT public.is_admin() THEN
    IF (NEW.full_name IS DISTINCT FROM OLD.full_name)
       OR (NEW.phone IS DISTINCT FROM OLD.phone)
       OR (NEW.date_of_birth IS DISTINCT FROM OLD.date_of_birth)
       OR (NEW.gender IS DISTINCT FROM OLD.gender)
       OR (NEW.is_locked IS DISTINCT FROM OLD.is_locked) THEN
      RAISE EXCEPTION 'Personal information is locked and cannot be changed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;