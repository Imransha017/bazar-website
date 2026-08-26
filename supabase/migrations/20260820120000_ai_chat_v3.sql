-- 1. Persistent Chat Threads
CREATE TABLE IF NOT EXISTS public.ai_chat_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES public.ai_chat_threads(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('assistant', 'user')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Chatbot Admin Configuration
CREATE TABLE IF NOT EXISTS public.ai_assistant_configs (
    id TEXT PRIMARY KEY, -- 'faq', 'policies', 'rules'
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- 3. Analytics Events
CREATE TABLE IF NOT EXISTS public.ai_assistant_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    event_type TEXT NOT NULL, -- 'chat_start', 'message_sent', 'product_click', 'order_lookup', 'conversion', 'fallback'
    payload JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. RLS & Permissions
ALTER TABLE public.ai_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assistant_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assistant_analytics ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own threads') THEN
        CREATE POLICY "Users can manage their own threads" ON public.ai_chat_threads FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own messages') THEN
        CREATE POLICY "Users can manage their own messages" ON public.ai_chat_messages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.ai_chat_threads WHERE id = thread_id AND user_id = auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage ai configs') THEN
        CREATE POLICY "Admins can manage ai configs" ON public.ai_assistant_configs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read ai configs') THEN
        CREATE POLICY "Anyone can read ai configs" ON public.ai_assistant_configs FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert analytics') THEN
        CREATE POLICY "Anyone can insert analytics" ON public.ai_assistant_analytics FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view analytics') THEN
        CREATE POLICY "Admins can view analytics" ON public.ai_assistant_analytics FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

GRANT ALL ON public.ai_chat_threads TO authenticated;
GRANT ALL ON public.ai_chat_messages TO authenticated;
GRANT ALL ON public.ai_assistant_configs TO authenticated;
GRANT ALL ON public.ai_assistant_analytics TO authenticated;
GRANT SELECT ON public.ai_assistant_configs TO anon;
GRANT INSERT ON public.ai_assistant_analytics TO anon;
GRANT ALL ON public.ai_chat_threads TO service_role;
GRANT ALL ON public.ai_chat_messages TO service_role;
GRANT ALL ON public.ai_assistant_configs TO service_role;
GRANT ALL ON public.ai_assistant_analytics TO service_role;

INSERT INTO public.ai_assistant_configs (id, content) VALUES
('faq', '[]'::jsonb),
('policies', '{"delivery": "Inside Dhaka: 60 TK, Outside Dhaka: 120 TK.", "return": "7 days easy return."}'::jsonb),
('rules', '{"fallback_message": "I couldn’t find an answer. Contact admin?"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
