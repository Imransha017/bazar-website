CREATE OR REPLACE FUNCTION public.increment_short_link_metric(link_id uuid, metric text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF metric = 'views_count' THEN
        UPDATE public.dropshipper_short_links SET views_count = views_count + 1, last_clicked_at = now() WHERE id = link_id;
    ELSIF metric = 'cart_adds_count' THEN
        UPDATE public.dropshipper_short_links SET cart_adds_count = cart_adds_count + 1 WHERE id = link_id;
    ELSIF metric = 'conversions_count' THEN
        UPDATE public.dropshipper_short_links SET conversions_count = conversions_count + 1 WHERE id = link_id;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_short_link_metric(uuid, text) TO authenticated, service_role, anon;
