
do $$
begin
    if not exists (select 1 from pg_attribute where attrelid = 'public.admin_audit_logs'::regclass and attname = 'note') then
        alter table public.admin_audit_logs add column note text;
    end if;
end
$$;

do $$
begin
    if not exists (select 1 from pg_attribute where attrelid = 'public.admin_audit_logs'::regclass and attname = 'actor_email') then
        alter table public.admin_audit_logs add column actor_email text;
    end if;
end
$$;
