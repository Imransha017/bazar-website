ALTER TABLE public.ai_memory_files
  ADD COLUMN IF NOT EXISTS extraction_status text NOT NULL DEFAULT 'success',
  ADD COLUMN IF NOT EXISTS extraction_error text,
  ADD COLUMN IF NOT EXISTS extracted_at timestamptz DEFAULT now();