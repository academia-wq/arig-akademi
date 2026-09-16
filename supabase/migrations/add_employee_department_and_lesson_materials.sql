-- Ажилтны харьяалагдах алба (админ "Ажилтан нэмэх" маягтаас тохируулна)
alter table public.profiles add column if not exists department text;

-- Хичээлд хавсаргасан PDF материалын URL-үүд ("Сургалт нэмэх" маягтаас)
alter table public.lessons add column if not exists material_urls text[] default '{}';
