DROP POLICY IF EXISTS "Public read non secret ai configs" ON public.ai_assistant_configs;
CREATE POLICY "Public read non secret ai configs" ON public.ai_assistant_configs
FOR SELECT TO anon, authenticated
USING (id = ANY (ARRAY['faq','policies','rules','settings','appearance']));
GRANT SELECT ON public.ai_assistant_configs TO anon, authenticated;