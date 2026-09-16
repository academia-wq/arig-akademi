-- Хэрэглэгчийн профайл зургийн storage bucket (нийтэд нээлттэй унших, зөвхөн сервер талаас бичих)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
