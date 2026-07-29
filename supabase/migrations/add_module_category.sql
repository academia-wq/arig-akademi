-- Бүлгүүдийг том ангилал (folder) болгон бүлэглэхэд ашиглана.
-- Утга нь хоосон/NULL бол "Ангилалгүй" гэж харагдана.
alter table public.modules add column if not exists category text;
