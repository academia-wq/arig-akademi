create table if not exists public.onboarding_plans (
  id uuid primary key default gen_random_uuid(),
  employee_email text not null,
  company_name text not null,
  job_title text not null,
  plan jsonb not null,
  created_by uuid references public.profiles(id),
  sent_at timestamptz,
  created_at timestamptz default now()
);

alter table public.onboarding_plans enable row level security;

create policy "Admins manage onboarding plans"
  on public.onboarding_plans for all
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
