-- Update coupons table
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_dropshipper_exclusive boolean DEFAULT false;

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    subject text NOT NULL,
    status text NOT NULL DEFAULT 'open', -- open, in-progress, closed
    priority text NOT NULL DEFAULT 'medium', -- low, medium, high
    category text NOT NULL, -- order, payment, technical, account, other
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES auth.users(id) NOT NULL,
    message text NOT NULL,
    is_admin_reply boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;

-- Policies for tickets
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create tickets"
ON public.support_tickets FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all tickets"
ON public.support_tickets FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policies for messages
CREATE POLICY "Users can view messages for their tickets"
ON public.support_messages FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.support_tickets 
        WHERE id = ticket_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Users can send messages"
ON public.support_messages FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.support_tickets 
        WHERE id = ticket_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
);
