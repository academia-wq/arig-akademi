# Ариг Академи

Техникийн спецификаци (`arig-akademi-tech-spec.md`) дээр үндэслэсэн эхлэлийн код.

## Юу бэлэн болсон бэ

- ✅ Next.js 14 App Router бүтэц (spec §3-тай яг тохирсон)
- ✅ Supabase Auth (и-мэйл/нууц үг + Google OAuth) — `(auth)/login`, `(auth)/register`
- ✅ Middleware-р хамгаалагдсан `(app)` болон `(admin)` route бүлгүүд
- ✅ Бүрэн SQL схем + RLS policy (`supabase/schema.sql`)
- ✅ Маркетингийн хуудсууд: нүүр, курсын жагсаалт, курсын дэлгэрэнгүй + үнэгүй элсэлт
- ✅ Dashboard: элссэн курсууд, явцын %
- ✅ Хичээл үзэх хуудас: Mux Player, 10 секунд тутамд явц хадгалах, 90%+ дээр автомат "дууссан"
- ✅ Admin: курс/бүлэг/хичээл нэмэх, нийтлэх, Mux Direct Upload widget
- ✅ `/api/mux/upload`, `/api/mux/webhook`, `/api/progress` route-ууд

## Хийгээгүй / дараа нэмэх зүйлс

- Stripe/QPay төлбөрийн интеграц (spec §4.4-т төлбөртэй курсын урсгал тодорхойлсон боловч энд зөвхөн үнэгүй элсэлтийн жишээ бичигдсэн)
- Зураг/thumbnail upload (Supabase Storage)
- Байрлал өөрчлөх (drag-and-drop reorder) modules/lessons
- Тестүүд

## Эхлүүлэх

```bash
npm install
cp .env.example .env.local   # утгуудыг бөглөнө
```

### 1. Supabase

1. [supabase.com](https://supabase.com)-д шинэ project үүсгэ.
2. SQL Editor-т `supabase/schema.sql` файлын агуулгыг бүтнээр нь paste хийж ажиллуул.
3. Authentication → Providers хэсэгт Google OAuth-г идэвхжүүл (заавал биш).
4. Project Settings → API-с URL, anon key, service_role key-г `.env.local`-д хуул.

### 2. Mux

1. [mux.com](https://mux.com)-д бүртгүүлж Access Token үүсгэ (`MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`).
2. Webhook үүсгэж (`video.asset.ready` event), URL-г `https://<домэйн>/api/mux/webhook` гэж тохируул, `MUX_WEBHOOK_SECRET`-г хуул.
3. Локал дээр туршихдаа [ngrok](https://ngrok.com) эсвэл `mux CLI`-р webhook-г урагшлуулж болно.

### 3. Ажиллуулах

```bash
npm run dev
```

`http://localhost:3000` дээр нээгдэнэ. Эхний хэрэглэгчээ бүртгүүлээд Supabase Table Editor-с `profiles.role`-г `admin` болгож солиход admin хэсэг рүү орох боломжтой болно.

## Дараагийн алхмуудад зориулж

Энэ кодыг **Claude Code**-т ачаалж үргэлжлүүлбэл: `npm install`, `npm run dev`, Supabase CLI, git commit зэргийг шууд ажиллуулж, алдаа гарвал шууд зассуулж болно — учир нь энд (chat орчинд) network болон terminal бодит цагийн харилцан үйлдэл хязгаарлагдмал.
