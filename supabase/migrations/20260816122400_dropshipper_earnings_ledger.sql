-- Create a ledger view or ensure dropshipper_earnings has enough info
-- The table already exists, let's add a 'note' or 'reason' column if missing for better ledger tracking
ALTER TABLE public.dropshipper_earnings ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.dropshipper_earnings ADD COLUMN IF NOT EXISTS activity_log jsonb DEFAULT '[]'::jsonb;

-- Update the sync function to log activities
CREATE OR REPLACE FUNCTION public.log_dropshipper_earning_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    NEW.activity_log := OLD.activity_log || jsonb_build_object(
      'status', NEW.status,
      'changed_at', now(),
      'previous_status', OLD.status,
      'note', 'Status automatically updated based on order status change'
    );
  ELSIF (TG_OP = 'INSERT') THEN
    NEW.activity_log := jsonb_build_array(jsonb_build_object(
      'status', NEW.status,
      'changed_at', now(),
      'note', 'Earning created (pending)'
    ));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_dropshipper_earning_activity ON public.dropshipper_earnings;
CREATE TRIGGER trg_log_dropshipper_earning_activity
  BEFORE INSERT OR UPDATE ON public.dropshipper_earnings
  FOR EACH ROW EXECUTE FUNCTION public.log_dropshipper_earning_activity();

COMMENT ON COLUMN public.dropshipper_earnings.activity_log IS 'History of status changes and notes for the profit ledger.';
