create table if not exists public.mystery_shopper_evaluations (
  id uuid primary key default gen_random_uuid(),
  branch_name text not null,
  evaluation_date date not null,
  evaluator_name text not null,
  evaluation_time text,
  comment text,
  total_score integer not null,
  max_score integer not null,
  answers jsonb not null,
  created_at timestamptz default now()
);

alter table public.mystery_shopper_evaluations enable row level security;

create policy "Admins manage mystery shopper evaluations"
  on public.mystery_shopper_evaluations for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'instructor')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'instructor')
    )
  );

insert into storage.buckets (id, name, public)
values ('mystery-shopper-images', 'mystery-shopper-images', true)
on conflict (id) do nothing;
