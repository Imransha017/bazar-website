-- Drop existing support_messages to recreate with correct columns
DROP TABLE IF EXISTS public.support_messages;

-- Support tickets table (ensure all columns exist)
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS message TEXT; -- Already exists from my previous migration, but explicitly checking

-- Support messages table (recreated with sender_id and is_admin_reply)
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_admin_reply BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
