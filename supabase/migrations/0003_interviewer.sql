-- 新增：面试官
alter table public.interviews
  add column if not exists interviewer text not null default '';
