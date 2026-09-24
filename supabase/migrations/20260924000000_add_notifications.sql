-- Мэдэгдлийн хүснэгт
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('lesson_added', 'certificate_ready', 'employee_added')),
  title text not null,
  body text not null,
  course_id uuid references public.courses(id) on delete cascade,
  related_user_id uuid references public.profiles(id) on delete cascade,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists notifications_user_id_idx
  on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Шинэ ажилтан бүртгүүлэхэд admin/instructor нарт мэдэгдэнэ.
-- (handle_new_user() функцийг өргөтгөв.)
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
declare
  admin_id uuid;
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');

  for admin_id in
    select id from public.profiles where role in ('admin', 'instructor') and id <> new.id
  loop
    insert into public.notifications (user_id, type, title, body, related_user_id)
    values (
      admin_id,
      'employee_added',
      'Шинэ ажилтан нэмэгдлээ',
      coalesce(new.raw_user_meta_data->>'full_name', 'Шинэ хэрэглэгч') || ' бүртгүүллээ',
      new.id
    );
  end loop;

  return new;
end;
$$ language plpgsql security definer;

-- ─────────────────────────────────────────────
-- Хичээл нэмэгдэхэд тухайн сургалтад элссэн бүх хэрэглэгчид мэдэгдэнэ.
-- ─────────────────────────────────────────────
create or replace function public.notify_lesson_added()
returns trigger as $$
declare
  v_course_id uuid;
  v_course_title text;
  enrolled_user uuid;
begin
  select courses.id, courses.title into v_course_id, v_course_title
  from public.modules
  join public.courses on courses.id = modules.course_id
  where modules.id = new.module_id;

  if v_course_id is null then
    return new;
  end if;

  for enrolled_user in
    select user_id from public.enrollments where course_id = v_course_id
  loop
    insert into public.notifications (user_id, type, title, body, course_id)
    values (
      enrolled_user,
      'lesson_added',
      'Шинэ хичээл нэмэгдлээ',
      '"' || v_course_title || '" сургалтад шинэ хичээл нэмэгдлээ',
      v_course_id
    );
  end loop;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_lesson_created on public.lessons;
create trigger on_lesson_created
  after insert on public.lessons
  for each row execute procedure public.notify_lesson_added();

-- ─────────────────────────────────────────────
-- Хэрэглэгч сургалтын бүх хичээлээ дуусгаж, гэрчилгээ бэлэн болоход мэдэгдэнэ.
-- ─────────────────────────────────────────────
create or replace function public.notify_certificate_ready()
returns trigger as $$
declare
  v_course_id uuid;
  v_course_title text;
  v_total int;
  v_completed int;
begin
  if new.is_completed is distinct from true then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.is_completed = true then
    return new;
  end if;

  select modules.course_id, courses.title into v_course_id, v_course_title
  from public.lessons
  join public.modules on modules.id = lessons.module_id
  join public.courses on courses.id = modules.course_id
  where lessons.id = new.lesson_id;

  if v_course_id is null then
    return new;
  end if;

  select count(*) into v_total
  from public.lessons
  join public.modules on modules.id = lessons.module_id
  where modules.course_id = v_course_id;

  select count(*) into v_completed
  from public.lesson_progress
  join public.lessons on lessons.id = lesson_progress.lesson_id
  join public.modules on modules.id = lessons.module_id
  where modules.course_id = v_course_id
    and lesson_progress.user_id = new.user_id
    and lesson_progress.is_completed = true;

  if v_total > 0 and v_completed >= v_total then
    insert into public.notifications (user_id, type, title, body, course_id)
    values (
      new.user_id,
      'certificate_ready',
      'Гэрчилгээ бэлэн боллоо',
      '"' || v_course_title || '" сургалтын гэрчилгээг татаж авах боломжтой боллоо',
      v_course_id
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_lesson_progress_completed on public.lesson_progress;
create trigger on_lesson_progress_completed
  after insert or update on public.lesson_progress
  for each row execute procedure public.notify_certificate_ready();
