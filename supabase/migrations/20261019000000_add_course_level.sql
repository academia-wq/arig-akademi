-- Сургалтын түвшин (хичээлийн хуудасны "Сургалтын дэлгэрэнгүй"-д харагдана).
alter table public.courses
  add column if not exists level text
  check (level in ('Анхан', 'Дунд', 'Ахисан'));
