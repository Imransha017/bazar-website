ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS ai_thread_id uuid;

CREATE INDEX IF NOT EXISTS orders_source_idx ON public.orders (source);