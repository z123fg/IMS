-- IMS 初始化：面试表 + 图片存储桶 + RLS
-- 在 Supabase 控制台 SQL Editor 中整段执行（可重复执行）

-- ── 面试表 ───────────────────────────────────────────────
create table if not exists public.interviews (
  id              uuid primary key default gen_random_uuid(),
  client          text not null default '',
  vendor          text not null default '',
  interview_type  text not null default '',
  received_at     date default current_date,
  interview_at    timestamptz,
  jd              jsonb,                          -- Tiptap 文档 JSON；空文档为 null
  jd_rev          integer not null default 0,     -- 每次保存 +1，用于冲突检测
  materials       jsonb,
  materials_rev   integer not null default 0,
  created_by      uuid default auth.uid() references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists interviews_received_at_idx on public.interviews (received_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists interviews_set_updated_at on public.interviews;
create trigger interviews_set_updated_at
  before update on public.interviews
  for each row execute function public.set_updated_at();

-- 团队共享：所有登录用户可读写；匿名用户无任何权限
alter table public.interviews enable row level security;

drop policy if exists "authenticated full access" on public.interviews;
create policy "authenticated full access" on public.interviews
  for all to authenticated
  using (true)
  with check (true);

revoke all on public.interviews from anon;
grant select, insert, update, delete on public.interviews to authenticated;

-- ── 保活：GitHub Actions 定时调用，产生一次真实的数据库请求 ──
create or replace function public.ping()
returns text
language sql
stable
set search_path = ''
as $$ select 'pong' $$;

grant execute on function public.ping() to anon, authenticated;

-- ── 图片存储桶（私有）：路径 {interview_id}/{uuid}.webp ──────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ims-images', 'ims-images', false, 5242880,
        array['image/webp', 'image/png', 'image/jpeg', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "ims-images select" on storage.objects;
create policy "ims-images select" on storage.objects
  for select to authenticated using (bucket_id = 'ims-images');

drop policy if exists "ims-images insert" on storage.objects;
create policy "ims-images insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'ims-images');

drop policy if exists "ims-images update" on storage.objects;
create policy "ims-images update" on storage.objects
  for update to authenticated using (bucket_id = 'ims-images');

drop policy if exists "ims-images delete" on storage.objects;
create policy "ims-images delete" on storage.objects
  for delete to authenticated using (bucket_id = 'ims-images');
