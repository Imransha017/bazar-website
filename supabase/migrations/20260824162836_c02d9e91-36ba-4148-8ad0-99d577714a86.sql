-- Access rules for the "public" media bucket (dropshipper logos/banners/avatars)
DROP POLICY IF EXISTS "Read public media bucket" ON storage.objects;
CREATE POLICY "Read public media bucket" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'public');

DROP POLICY IF EXISTS "Authenticated upload public media" ON storage.objects;
CREATE POLICY "Authenticated upload public media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'public');

DROP POLICY IF EXISTS "Authenticated update own public media" ON storage.objects;
CREATE POLICY "Authenticated update own public media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'public' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'public' AND owner = auth.uid());

DROP POLICY IF EXISTS "Authenticated delete own public media" ON storage.objects;
CREATE POLICY "Authenticated delete own public media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'public' AND owner = auth.uid());