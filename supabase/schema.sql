-- Ариг Академи — Supabase схем
-- Ажиллуулах дараалал: энэ файлыг Supabase Dashboard > SQL Editor-т бүтнээр нь paste хийж Run дарна.

-- ─────────────────────────────────────────────
-- 1. Хүснэгтүүд
-- ─────────────────────────────────────────────

create table public.profiles (
  id uuid references auth.users(id) primary key,
  full_name text,
  avatar_url text,
  role text default 'student' check (role in ('student', 'instructor', 'admin')),
  created_at timestamptz default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  thumbnail_url text,
  price numeric default 0,
  is_published boolean default false,
  instructor_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  position integer not null default 0
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.modules(id) on delete cascade,
  title text not null,
  content_text text,
  mux_playback_id text,
  mux_asset_id text,
  duration_seconds integer,
  position integer not null default 0,
  is_free_preview boolean default false
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  course_id uuid references public.courses(id),
  enrolled_at timestamptz default now(),
  unique(user_id, course_id)
);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  lesson_id uuid references public.lessons(id),
  is_completed boolean default false,
  last_position_seconds integer default 0,
  completed_at timestamptz,
  unique(user_id, lesson_id)
);

-- AI (Claude) ашигласан үйлдлүүдийг бүртгэж, өдрийн хязгаар тавихад ашиглана
create table public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  feature text not null,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 2. Шинэ хэрэглэгч бүртгүүлэхэд profile автоматаар үүсгэх trigger
-- ─────────────────────────────────────────────

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- 3. Row Level Security
-- ─────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.ai_usage_logs enable row level security;

-- profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- courses
create policy "Published courses are public"
  on public.courses for select
  using (is_published = true);

create policy "Instructors manage own courses"
  on public.courses for all
  using (auth.uid() = instructor_id)
  with check (auth.uid() = instructor_id);

-- modules (харагдах эрх нь харьяалагдах courses-той адилхан)
create policy "Modules visible if course is published"
  on public.modules for select
  using (
    exists (
      select 1 from public.courses
      where courses.id = modules.course_id
      and (courses.is_published = true or courses.instructor_id = auth.uid())
    )
  );

create policy "Instructors manage own course modules"
  on public.modules for all
  using (
    exists (
      select 1 from public.courses
      where courses.id = modules.course_id
      and courses.instructor_id = auth.uid()
    )
  );

-- lessons: чөлөөт preview эсвэл элссэн хэрэглэгч л харна
create policy "Free preview lessons are public"
  on public.lessons for select
  using (is_free_preview = true);

create policy "Enrolled users can view lessons"
  on public.lessons for select
  using (
    exists (
      select 1 from public.modules
      join public.enrollments on enrollments.course_id = modules.course_id
      where modules.id = lessons.module_id
      and enrollments.user_id = auth.uid()
    )
  );

create policy "Instructors manage own lessons"
  on public.lessons for all
  using (
    exists (
      select 1 from public.modules
      join public.courses on courses.id = modules.course_id
      where modules.id = lessons.module_id
      and courses.instructor_id = auth.uid()
    )
  );

-- enrollments
create policy "Users can view own enrollments"
  on public.enrollments for select
  using (auth.uid() = user_id);

create policy "Users can enroll themselves"
  on public.enrollments for insert
  with check (auth.uid() = user_id);

-- lesson_progress
create policy "Users can view own progress"
  on public.lesson_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.lesson_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.lesson_progress for update
  using (auth.uid() = user_id);

-- ai_usage_logs
create policy "Users can view own AI usage"
  on public.ai_usage_logs for select
  using (auth.uid() = user_id);

create policy "Users can log own AI usage"
  on public.ai_usage_logs for insert
  with check (auth.uid() = user_id);
