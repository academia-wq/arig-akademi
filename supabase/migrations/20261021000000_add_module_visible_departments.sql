-- Модулийг ажилтны хэлтсээр хязгаарлах (хоосон = бүх хэлтэст харагдана).
-- visible_positions-той хамт ажиллана: хоёулаа тохирсон үед л харагдана.
alter table public.modules
  add column if not exists visible_departments text[];
