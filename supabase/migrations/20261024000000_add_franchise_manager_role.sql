-- ─────────────────────────────────────────────
-- Франчайз (2-р үе): франчайзын менежерийн эрх
-- Менежер нь өөрийн франчайзын (profiles.franchise_id) ажилтнуудын явцыг харж,
-- хэлтэс/албан тушаал оноож, идэвхгүй болгоно. Эрх шалгалт сервер талд
-- (app/(app)/franchise/actions.ts) хийгдэж, өгөгдлийг service role-оор уншина.
-- Role-ийг хэрэглэгч өөрөө өөрчлөхийг protect_profile_columns trigger хориглосон хэвээр.
-- ─────────────────────────────────────────────

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('student', 'instructor', 'admin', 'franchise_manager'));
