-- ─────────────────────────────────────────────
-- Франчайз (1-р үе): үндсэн / франчайзын ажилтан, сургалт хэнд зориулсан
-- ─────────────────────────────────────────────

-- 1. Франчайзын жагсаалт. Бүртгэлийн код нь /register?code=... холбоосонд орно.
--    RLS идэвхтэй, бодлого байхгүй — зөвхөн сервер (service role) уншина/бичнэ.
create table if not exists public.franchises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.franchises enable row level security;

-- 2. Ажилтны төрөл ба харьяалагдах франчайз
alter table public.profiles
  add column if not exists employee_type text not null default 'core',
  add column if not exists franchise_id uuid references public.franchises(id) on delete set null;
alter table public.profiles drop constraint if exists profiles_employee_type_check;
alter table public.profiles
  add constraint profiles_employee_type_check check (employee_type in ('core', 'franchise'));

-- 3. Сургалт (модуль) хэнд зориулсан. Одоо байгаа бүх модуль "Үндсэн" болно.
alter table public.modules
  add column if not exists audience text not null default 'core';
alter table public.modules drop constraint if exists modules_audience_check;
alter table public.modules
  add constraint modules_audience_check check (audience in ('core', 'franchise', 'all'));

-- 4. Бүртгүүлэхэд франчайзын код (user metadata: franchise_code) таарвал
--    тухайн франчайзын ажилтан болгоно. Админуудад очих мэдэгдэл хэвээр.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  admin_id uuid;
  fr_id uuid;
  fr_name text;
begin
  select id, name into fr_id, fr_name
  from public.franchises
  where is_active
    and invite_code = upper(trim(coalesce(new.raw_user_meta_data->>'franchise_code', '')));

  insert into public.profiles (id, full_name, employee_type, franchise_id)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    case when fr_id is null then 'core' else 'franchise' end,
    fr_id
  );

  for admin_id in
    select id from public.profiles where role in ('admin', 'instructor') and id <> new.id
  loop
    insert into public.notifications (user_id, type, title, body, related_user_id)
    values (
      admin_id,
      'employee_added',
      'Шинэ ажилтан нэмэгдлээ',
      coalesce(new.raw_user_meta_data->>'full_name', 'Шинэ хэрэглэгч') || ' бүртгүүллээ'
        || coalesce(' (франчайз: ' || fr_name || ')', ''),
      new.id
    );
  end loop;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 5. АЮУЛГҮЙ БАЙДАЛ: "Users can update own profile" бодлого нь хэрэглэгчид өөрийн
--    мөрийн БҮХ баганыг (role-ийг ч) өөрчлөх боломж олгож байсан. Эрх, хэлтэс,
--    албан тушаал, ажилтны төрөл, франчайзыг зөвхөн сервер (service role) өөрчилнө.
create or replace function public.protect_profile_columns()
returns trigger as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') and (
       new.role is distinct from old.role
    or new.department is distinct from old.department
    or new.position is distinct from old.position
    or new.employee_type is distinct from old.employee_type
    or new.franchise_id is distinct from old.franchise_id
  ) then
    raise exception 'Эрх, хэлтэс, албан тушаалыг зөвхөн админ өөрчилнө.';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();
