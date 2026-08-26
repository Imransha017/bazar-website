-- Add missing columns to dropshippers table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dropshippers' AND COLUMN_NAME = 'payout_method') THEN
        ALTER TABLE public.dropshippers ADD COLUMN payout_method text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dropshippers' AND COLUMN_NAME = 'payout_number') THEN
        ALTER TABLE public.dropshippers ADD COLUMN payout_number text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dropshippers' AND COLUMN_NAME = 'whatsapp') THEN
        ALTER TABLE public.dropshippers ADD COLUMN whatsapp text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dropshippers' AND COLUMN_NAME = 'status') THEN
        ALTER TABLE public.dropshippers ADD COLUMN status text DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dropshippers' AND COLUMN_NAME = 'total_earned') THEN
        ALTER TABLE public.dropshippers ADD COLUMN total_earned numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dropshippers' AND COLUMN_NAME = 'total_orders') THEN
        ALTER TABLE public.dropshippers ADD COLUMN total_orders integer DEFAULT 0;
    END IF;
END $$;

-- Update RLS policies to ensure dropshippers can insert their own application
GRANT ALL ON public.dropshippers TO authenticated;
GRANT SELECT ON public.dropshippers TO anon;

-- Note: The applyAsDropshipper function uses user_id from auth.uid()
ALTER TABLE public.dropshippers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dropshippers can insert their own application" ON public.dropshippers;
CREATE POLICY "Dropshippers can insert their own application" ON public.dropshippers
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Dropshippers can view their own profile" ON public.dropshippers;
CREATE POLICY "Dropshippers can view their own profile" ON public.dropshippers
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Dropshippers can update their own profile" ON public.dropshippers;
CREATE POLICY "Dropshippers can update their own profile" ON public.dropshippers
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

