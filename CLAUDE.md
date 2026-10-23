# Ариг Академи — Claude-д зориулсан төслийн тэмдэглэл

Ариг Интернэшнл ХХК-ийн (Ариг Аня, Ариг Рамэн) ажилтнуудын дотоод цахим сургалтын платформ.
Хэрэглэгчийн хэл: **монгол**. Хариулт, UI бичвэр, commit-ийн тайлбарыг монголоор (commit гарчиг англиар байж болно).

Сүүлд шалгасан: 2026-10-13.

## Технологи

- **Next.js 14** (App Router) + React 18 + TypeScript + Tailwind CSS
- **Supabase**: PostgreSQL + Auth (имэйл/нууц үг, Google) + Storage
- **Mux**: видео байршуулах/тоглуулах (`/api/mux/upload`, `/api/mux/webhook`)
- **Anthropic Claude**: файлаас курсын ноорог, онбординг төлөвлөгөө үүсгэх (`lib/anthropic/`)
- **Resend**: онбординг имэйл (`lib/email/`)
- **Zod**: өгөгдөл шалгалт. Stripe суусан ч төлбөр **хэрэгжээгүй**.
- Тусдаа сервер байхгүй: back-end нь Server Actions (`"use server"`) болон `app/api/*` route-ууд.

## Хавтасны бүтэц

- `app/(app)/` — нэвтэрсэн хэрэглэгч: `/`, `/dashboard`, `/learn`, `/certificates`, `/notifications`, `/settings`
- `app/(app)/admin/page.tsx` — **Админ самбар**. Табууд нь `tabs={[...]}` массивт: Тойм, Ажилтан, Сургалт,
  Хөөрөх зурвас, Бүтэц, Нууц үйлчлүүлэгч. Таб нэмэх/хасах бол энэ массивыг засна.
- `app/(app)/admin/actions.ts` — ажилтан, бүлэг, хичээл, PDF-ийн server action-ууд (`requireStaff()`-тэй)
- `app/(admin)/admin/...` — курс засах, оюутнууд; `structure/actions.ts` нь "Бүтэц"-ийг хадгална
- `app/mystery-shopper/` — нэвтрэлтгүй нийтийн үнэлгээний маягт
- `lib/supabase/server.ts` — `createClient()` (RLS-тэй), `getUser()` (request-д cache-лэгдсэн),
  `createServiceRoleClient()` (RLS-ийг тойрно — зөвхөн эрх шалгасны дараа)
- `middleware.ts` — `/dashboard`, `/learn`, `/settings`, `/admin`-ийг нэвтрэлтээр хамгаална
- `supabase/schema.sql` + `supabase/migrations/*.sql` — database. **Гараар** SQL Editor-т ажиллуулдаг.
- Эрх: `profiles.role` = `student` | `instructor` | `admin`. Админ хэсэгт admin/instructor л орно.

## Харагдах эрх (үндсэн / франчайз, хэлтэс)

- `lib/module-visibility.ts` → `isModuleVisible(mod, viewer)`: `modules.audience` (`core`|`franchise`|`all`)
  ↔ `profiles.employee_type` (`core`|`franchise`), дээр нь `visible_departments` / `visible_positions`.
  Модуль сонгох query бүрт `audience`, профайлд `employee_type`-ийг заавал оруулна.
- Кодгүй бүртгүүлж албан тушаал аваагүй үндсэн ажилтан (`isPendingViewer`) админ батлах хүртэл сургалт харахгүй.
- Франчайз: `franchises` хүснэгт (зөвхөн service role), бүртгэлийн холбоос `/register?code=XXXX` —
  кодыг `handle_new_user` trigger шалгаж `franchise_id`-г онооно. Админ самбарын "Франчайз" таб.
- `protect_profile_columns` trigger: role, department, position, employee_type, franchise_id-г зөвхөн
  service role (сервер) өөрчилнө — хэрэглэгч өөрийн профайлаас зөвхөн нэр, зураг солино.
- 2-р үе (хийгдээгүй): франчайзын менежер өөрийн франчайзын ажилтнуудыг харах эрх.

## "Бүтэц" таб (academy structure)

- Өгөгдөл: `academy_structure` хүснэгтийн ганц мөр (`id = 00000000-0000-0000-0000-000000000001`), `data` нь JSONB.
- Загвар: `lib/academy-structure/schema.ts` (Zod). Харуулах: `components/academy-structure-view.tsx`.
  Засах: `components/academy-structure-editor.tsx`. Хадгалах: `app/(admin)/admin/structure/actions.ts`.
- Шинэ талбар нэмэхэд 3 газар засна: schema.ts (+ `.default()` хуучин өгөгдөлд), editor, view.
- Материалын төрөл (`materials`) нэмэх товч UI-д байхгүй — SQL-ээр нэмнэ. Өнгө нь зөвхөн `ochre` | `juniper`.
- View дээр "Бүсийн 5 менежер" гэж тогтмол бичигдсэн (тоо өөрчлөгдөхөд засах шаардлагатай).

## Орчин (production)

- **GitHub**: `academia-wq/arig-akademi` (public repo — private болгохыг зөвлөсөн), production branch `main`.
- **Vercel**: баг `boogii` (эзэмшигч academia-wq / academia@ariganya.com), **Hobby багц** (арилжааны бус,
  багийн гишүүн нэмэх боломжгүй). Домэйн: https://arig-akademi.vercel.app. Функцийн бүс `bom1` (vercel.json).
  `main`-д push хийхэд автоматаар production deploy хийгдэнэ.
- **Supabase**: байгууллага `academia-boloroo`, project `pzvvqjnnfzlvneqeinzl` (Mumbai), **Free багц** —
  автомат backup БАЙХГҮЙ, 1 долоо хоног идэвхгүй бол зогсоно.
- Env хувьсагчдыг Vercel дээр "Sensitive" төрлөөр хадгалсан тул `vercel env pull`-ээр татагдахгүй.
  Локал `.env.local`-ийг Supabase/Mux/Anthropic/Resend dashboard-оос бөглөнө (`.env.example`-ийг харна уу).
- `RESEND_FROM_EMAIL` тохируулагдаагүй (onboarding@resend.dev-ээс илгээгдэнэ).

⚠️ Локал `npm run dev` нь **production database**-тэй холбогдоно — туршилтын өгөгдөл жинхэнэ өгөгдлийг өөрчилнө.

## Backup

- `backup.cmd` (давхар товшино) → `scripts/backup.ps1`: `pg_dump` + Storage bucket-уудыг огноотой хавтсанд хадгална.
- Тохиргоо: `.env.backup` (git-д орохгүй; анх ажиллуулахад загвар үүснэ): `SUPABASE_DB_URL` (Session pooler URI),
  `SUPABASE_SERVICE_ROLE_KEY` (`sb_secret_…` эсвэл legacy `eyJ…` — бүтнээр нь хуулах), `BACKUP_DIR` (repo-ийн гадна), `KEEP_LAST`.
- Шаардлага: PostgreSQL Command Line Tools (pg_dump 18).
- Script файл нь **UTF-8 with BOM** байх ёстой (Windows PowerShell 5.1 монгол бичвэрийг зөв уншихын тулд).

## Мэдэгдэж буй асуудлууд (засагдаагүй)

1. Mux webhook (`/api/mux/webhook`) видеог хичээлд холбож чадахгүй байна (signing secret эсвэл URL таарахгүй байх).
   Нөөц арга: видео хуулсны дараа `/api/mux/sync`-ээр шалгаж холбодог (`lib/mux-upload.ts` → `waitForMuxVideo`).
   Mux → Settings → Webhooks болон Vercel-ийн `MUX_WEBHOOK_SECRET`-ийг шалгах.
2. `generateDraftFromFile`, `saveDraftStructure` — role шалгадаггүй.
3. `/mystery-shopper` — нэвтрэлтгүй, service-role-оор бичдэг, spam хамгаалалтгүй.
4. Production DB-д `ai_usage_logs`, `onboarding_plans` хүснэгт **үүсээгүй** — `supabase/migration_ai_usage_logs.sql`,
   `supabase/migrations/add_onboarding_plans.sql`-ийг ажиллуулах шаардлагатай.
5. `lesson-materials` bucket-ийн migration файл байхгүй (production дээр гараар үүсгэсэн).
6. Supabase дээр зөвхөн `add_notifications` migration бүртгэлтэй — бусдыг гараар ажиллуулсан.
7. Нүүр хуудсанд нэвтрээгүй хүнд "0+ Нийт хичээл" харагддаг (RLS-ээс шалтгаалсан байх).
8. Автомат тест байхгүй.
9. Зураг/PDF нь server action-оор дамждаг тул Vercel-ийн ~4.5MB хүсэлтийн хязгаараас том файл хуулагдахгүй
   ("Сургалт нэмэх" цонх 4MB-аар хязгаарлана). Видео Mux руу шууд хуулагдана.

## Ажлын дүрэм

- Шалгах: `npx tsc --noEmit` (env шаардахгүй). `npm run build` env хувьсагч шаардана.
- Шинэ өөрчлөлтийг branch дээр хийж, `main` руу merge хийнэ (merge = production deploy).
- Database өөрчлөлт: `supabase/migrations/`-д шинэ SQL файл нэмээд Supabase SQL Editor-т ажиллуулна.
- Production database, Vercel, Supabase тохиргоонд өөрчлөлт хийхээс өмнө хэрэглэгчээс зөвшөөрөл авна.
- Нууц түлхүүрийг кодонд, commit-д, чатад хэзээ ч бүү оруул.
