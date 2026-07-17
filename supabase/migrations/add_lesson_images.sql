-- Хичээлд зураг нэмэх боломж (Mux видеогоос гадна)
alter table public.lessons add column if not exists image_url text;

-- Зурагны storage bucket (нийтэд нээлттэй унших, зөвхөн сервер талаас бичих)
insert into storage.buckets (id, name, public)
values ('lesson-images', 'lesson-images', true)
on conflict (id) do nothing;
