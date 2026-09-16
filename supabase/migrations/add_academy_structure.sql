create table if not exists public.academy_structure (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz default now()
);

alter table public.academy_structure enable row level security;

create policy "Admins manage academy structure"
  on public.academy_structure for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'instructor')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'instructor')
    )
  );

insert into public.academy_structure (id, data)
values (
  '00000000-0000-0000-0000-000000000001',
  '{
    "owner": { "name": "Болормаа", "role": "Ерөнхий менежер, Бүтээмж алба" },
    "deadline": "2026-11-01",
    "output": "Сургалтын Book",
    "regionalManagers": [
      { "name": "Насанжаргал", "focus": "" },
      { "name": "Мөнх-Эрдэнэ", "focus": "" },
      { "name": "Билигсайхан", "focus": "" },
      { "name": "Гэрэлмаа", "focus": "" },
      { "name": "Солонгоо", "focus": "" }
    ],
    "domainLeads": [
      { "domain": "Байгууллагын соёл", "role": "Зөвлөх менежер", "name": "Б.Дэлгэрмандал" },
      { "domain": "Менежмент", "role": "БАЕМ", "name": "Н.Болормаа" },
      { "domain": "Эрүүл ахуй", "role": "Эрүүл ахуйч", "name": "Ц.Онон" },
      { "domain": "Brand стандарт, Хөгжил", "role": "Хөгжлийн захирал", "name": "О.Мөнхдэлгэр" }
    ],
    "materials": [
      {
        "key": "intl",
        "title": "Ариг Интернэшнл",
        "color": "ochre",
        "branches": [
          { "title": "Шинэ ажилтан", "items": [] },
          {
            "title": "Үндсэн ажилтан",
            "items": [
              { "label": "1. Нэгдсэн", "sub": "хагас жил / сар тутам" },
              { "label": "2. Албадын сургалт", "sub": "" },
              { "label": "3. Хувь хүний хөгжил", "sub": "гадны сургалт" }
            ]
          }
        ]
      },
      {
        "key": "franchise",
        "title": "Франчайз",
        "color": "juniper",
        "branches": [
          { "title": "Эзэн", "items": [] },
          { "title": "Ажилтан", "items": [] }
        ]
      }
    ]
  }'::jsonb
)
on conflict (id) do nothing;
