-- Remove blanket read-everything policies
drop policy if exists "Authenticated users can select everything" on public.vendors;
drop policy if exists "Authenticated users can select everything" on public.dropshippers;
drop policy if exists "Authenticated users can select everything" on public.user_roles;
drop policy if exists "Authenticated users can select everything" on public.products;
drop policy if exists "Authenticated users can select everything" on public.categories;
drop policy if exists "Authenticated users can select everything" on public.banners;
drop policy if exists "Authenticated users can select everything" on public.reviews;

-- Users may read their own roles; admins read all
create policy "Users read own roles" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Signed-in users can still read approved reviews
create policy "Authenticated read approved reviews" on public.reviews
  for select to authenticated
  using (is_approved = true or public.is_admin());

-- AI configs: hide credential rows from the public
drop policy if exists "Anyone can read ai configs" on public.ai_assistant_configs;
create policy "Public read non secret ai configs" on public.ai_assistant_configs
  for select to anon, authenticated
  using (id in ('faq','policies','rules','settings'));