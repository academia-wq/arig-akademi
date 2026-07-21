-- Ажилтны албан тушаал (зөвхөн admin тохируулна)
alter table public.profiles add column if not exists position text;

-- Бүлэг (module) аль албан тушаалд харагдахыг тодорхойлно.
-- NULL эсвэл хоосон массив бол бүх ажилтанд харагдана (өөрчлөгдөөгүй хуучин бүлгүүд).
alter table public.modules add column if not exists visible_positions text[];
