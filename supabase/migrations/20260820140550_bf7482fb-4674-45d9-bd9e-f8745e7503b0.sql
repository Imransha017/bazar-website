-- Fixing RLS Enabled No Policy for AI tables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own threads' AND tablename = 'ai_chat_threads') THEN
        CREATE POLICY "Users can manage their own threads" ON public.ai_chat_threads FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own messages' AND tablename = 'ai_chat_messages') THEN
        CREATE POLICY "Users can manage their own messages" ON public.ai_chat_messages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.ai_chat_threads WHERE id = thread_id AND user_id = auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage ai configs' AND tablename = 'ai_assistant_configs') THEN
        CREATE POLICY "Admins can manage ai configs" ON public.ai_assistant_configs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read ai configs' AND tablename = 'ai_assistant_configs') THEN
        CREATE POLICY "Anyone can read ai configs" ON public.ai_assistant_configs FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert analytics' AND tablename = 'ai_assistant_analytics') THEN
        CREATE POLICY "Anyone can insert analytics" ON public.ai_assistant_analytics FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view analytics' AND tablename = 'ai_assistant_analytics') THEN
        CREATE POLICY "Admins can view analytics" ON public.ai_assistant_analytics FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;
