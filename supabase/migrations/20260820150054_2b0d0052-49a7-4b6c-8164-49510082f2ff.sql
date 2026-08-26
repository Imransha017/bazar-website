GRANT SELECT ON public.product_video_reviews TO anon, authenticated;
DROP POLICY IF EXISTS "Public reads approved video reviews" ON public.product_video_reviews;
CREATE POLICY "Public reads approved video reviews" ON public.product_video_reviews
  FOR SELECT TO anon, authenticated USING (status = 'approved');