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

CREATE TABLE IF NOT EXISTS public.ai_assistant_configs (
    id TEXT PRIMARY KEY,
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.ai_assistant_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT ALL ON public.ai_chat_threads TO authenticated, service_role;
GRANT ALL ON public.ai_chat_messages TO authenticated, service_role;
GRANT ALL ON public.ai_assistant_configs TO authenticated, service_role;
GRANT ALL ON public.ai_assistant_analytics TO authenticated, service_role;
GRANT SELECT ON public.ai_assistant_configs TO anon;
GRANT INSERT ON public.ai_assistant_analytics TO anon;

ALTER TABLE public.ai_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assistant_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assistant_analytics ENABLE ROW LEVEL SECURITY;

INSERT INTO public.ai_assistant_configs (id, content) VALUES
('faq', '[]'::jsonb),
('policies', '{"delivery": "Inside Dhaka: 60 TK, Outside Dhaka: 120 TK.", "returns": "7 days easy return."}'::jsonb),
('rules', '{"fallback_message": "আমি দুঃখিত, আমি আপনার প্রশ্নটি বুঝতে পারছি না। দয়া করে এডমিনের সাথে যোগাযোগ করুন।"}'::jsonb)
ON CONFLICT (id) DO NOTHING;