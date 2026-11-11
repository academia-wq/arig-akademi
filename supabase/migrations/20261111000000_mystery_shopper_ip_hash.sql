-- Нууц үйлчлүүлэгчийн маягтыг IP тус бүрээр хязгаарлахад зориулсан багана.
-- IP хаягийг өөрийг нь биш, SHA-256 hash-ийг хадгална.
alter table public.mystery_shopper_evaluations
  add column if not exists submitter_ip_hash text;

create index if not exists mystery_shopper_evaluations_ip_hash_created_at_idx
  on public.mystery_shopper_evaluations (submitter_ip_hash, created_at);
