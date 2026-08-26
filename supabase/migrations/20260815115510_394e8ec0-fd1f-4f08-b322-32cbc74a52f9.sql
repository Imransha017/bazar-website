ALTER TABLE public.order_activities ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id);
ALTER TABLE public.order_activities ADD COLUMN IF NOT EXISTS dropshipper_id uuid REFERENCES public.dropshippers(id);

GRANT SELECT ON public.order_activities TO authenticated;
GRANT ALL ON public.order_activities TO service_role;