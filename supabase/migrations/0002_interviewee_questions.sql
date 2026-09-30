-- 新增：面试者、面试题（富文本，与 JD / 材料相同）
alter table public.interviews
  add column if not exists interviewee   text not null default '',
  add column if not exists questions     jsonb,
  add column if not exists questions_rev integer not null default 0;
