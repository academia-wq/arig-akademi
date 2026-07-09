-- Одоо байгаа Supabase төсөлд нэмэлт хийх migration.
-- Ажиллуулах: Supabase Dashboard > SQL Editor-т энэ файлыг бүтнээр нь paste хийж Run дарна.
-- (schema.sql-г дахин бүтнээр нь ажиллуулах шаардлагагүй — зөвхөн энэ хэсгийг нэмнэ.)

create table public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  feature text not null,
  created_at timestamptz default now()
);

alter table public.ai_usage_logs enable row level security;

create policy "Users can view own AI usage"
  on public.ai_usage_logs for select
  using (auth.uid() = user_id);

create policy "Users can log own AI usage"
  on public.ai_usage_logs for insert
  with check (auth.uid() = user_id);
