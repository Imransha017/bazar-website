CREATE OR REPLACE FUNCTION public.my_dropshipper_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.dropshippers WHERE user_id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.my_dropshipper_ids() TO authenticated;

DROP POLICY IF EXISTS "Parents can see sub-affiliate performance" ON public.dropshippers;

CREATE POLICY "Parents can see sub-affiliate performance"
ON public.dropshippers
FOR SELECT TO authenticated
USING (parent_dropshipper_id IN (SELECT public.my_dropshipper_ids()));