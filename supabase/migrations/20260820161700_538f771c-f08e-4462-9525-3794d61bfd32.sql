create table if not exists public.ai_memory_files (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  storage_path text,
  content text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.ai_memory_files to authenticated;
grant all on public.ai_memory_files to service_role;
alter table public.ai_memory_files enable row level security;
drop policy if exists "admins manage ai memory" on public.ai_memory_files;
create policy "admins manage ai memory" on public.ai_memory_files
  for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

drop policy if exists "admin ai memory objects" on storage.objects;
create policy "admin ai memory objects" on storage.objects
  for all to authenticated
  using (bucket_id = 'ai-memory' and public.has_role(auth.uid(),'admin'))
  with check (bucket_id = 'ai-memory' and public.has_role(auth.uid(),'admin'));

insert into public.ai_assistant_configs (id, content)
values ('settings', '{"enabled": true, "memory_only": true}'::jsonb)
on conflict (id) do nothing;