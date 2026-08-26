UPDATE public.products
SET image = 'https://picsum.photos/seed/' || replace(id::text, '-', '') || '/600/600'
WHERE image LIKE '%loremflickr%';

UPDATE public.products
SET images = ARRAY(SELECT CASE WHEN u LIKE '%loremflickr%'
                               THEN 'https://picsum.photos/seed/' || replace(id::text,'-','') || '-' || ord || '/600/600'
                               ELSE u END
                   FROM unnest(images) WITH ORDINALITY AS t(u, ord))
WHERE EXISTS (SELECT 1 FROM unnest(images) x WHERE x LIKE '%loremflickr%');

UPDATE public.products
SET gallery = ARRAY(SELECT CASE WHEN u LIKE '%loremflickr%'
                               THEN 'https://picsum.photos/seed/' || replace(id::text,'-','') || '-g' || ord || '/600/600'
                               ELSE u END
                   FROM unnest(gallery) WITH ORDINALITY AS t(u, ord))
WHERE gallery IS NOT NULL AND EXISTS (SELECT 1 FROM unnest(gallery) x WHERE x LIKE '%loremflickr%');

UPDATE public.banners SET image_url = 'https://picsum.photos/seed/' || replace(id::text,'-','') || '/1200/400'
WHERE image_url LIKE '%loremflickr%';