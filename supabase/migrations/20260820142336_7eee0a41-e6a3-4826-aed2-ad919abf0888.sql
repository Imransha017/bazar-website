DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload own folder products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update own folder products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete own folder products" ON storage.objects;

CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'products');

CREATE POLICY "Authenticated upload own product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Authenticated update own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  bucket_id = 'products'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Authenticated delete own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  )
);