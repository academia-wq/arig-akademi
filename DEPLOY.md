# Deploy хийх заавар

`npm run build` амжилттай ажилладаг болсон тул төсөл deploy хийхэд бэлэн. Доорх алхмуудыг дараалан хийнэ.

## 0. Git commit (Claude блоклогдсон алхам)

Аюулгүй байдлын автомат шалгуур `.env.local`-д нууц түлхүүрүүд байгаа тул commit хийхийг блоклосон (бодит байдал дээр `.gitignore`-д `.env.local` орсон тул commit-д ороогүй — шалгасан). Та эсвэл дараагийн Claude сесс энэ алхмыг гараар баталгаажуулж хийнэ:

```sh
git add -A
git status --short   # .env.local ороогүй эсэхийг нэг бодоод шалгаарай
git commit -m "Initial commit"
```

## 1. GitHub repo үүсгэх (Vercel-ээр deploy хийх бол шаардлагатай)

1. [github.com/new](https://github.com/new) дээр шинэ private repo үүсгэнэ.
2. Локал repo-гоо холбоод push хийнэ:
   ```sh
   git remote add origin https://github.com/<username>/<repo-name>.git
   git branch -M main
   git push -u origin main
   ```

## 2. Vercel-ээр deploy хийх

1. [vercel.com](https://vercel.com) дээр GitHub бүртгэлээрээ нэвтэрнэ (эсвэл шинэ бүртгэл).
2. **Add New → Project** дараад дээрх GitHub repo-гоо сонгоно. Next.js-г Vercel автоматаар танина, тохиргоо нэмж хийх шаардлагагүй.
3. **Environment Variables** хэсэгт доорх бүгдийг нэмнэ (утгуудыг `.env.local`-аасаа хуулна):

   | Key | Тайлбар |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (нууц!) |
   | `MUX_TOKEN_ID` | Mux access token ID |
   | `MUX_TOKEN_SECRET` | Mux access token secret |
   | `MUX_WEBHOOK_SECRET` | Mux webhook signing secret |
   | `NEXT_PUBLIC_SITE_URL` | Deploy хийсний дараа Vercel өгөх домэйн, жишээ нь `https://arig-akademi.vercel.app` (эхлээд deploy хийгээд домэйноо мэдсэний дараа энэ утгыг нэмж, дахин deploy хийж болно) |
   | `ANTHROPIC_API_KEY` | (Заавал биш) Claude API key — байхгүй бол "Файлаас автоматаар үүсгэх" хэсэг зүгээр нуугдана |

4. **Deploy** дарна. 1-2 минутын дараа домэйн бэлэн болно.

## 3. Supabase-г production домэйнд тохируулах

Supabase Dashboard-ийн энэ project → **Authentication → URL Configuration**:

- **Site URL**-г Vercel-ээс авсан бодит домэйнаар солино (жишээ: `https://arig-akademi.vercel.app`).
- **Redirect URLs**-д нэмнэ:
  - `https://<домэйн>/api/auth/callback`
  - (Хэрэв Google OAuth ашиглаж байгаа бол) Google Cloud Console-ийн OAuth client-ийн **Authorized redirect URIs**-д Supabase-ийн callback URL-г мөн нэмэх шаардлагатайг сануулъя — энэ нь Supabase Dashboard → Authentication → Providers → Google хэсэгт харагдана.

## 4. Mux webhook-г production дээр холбох

Mux Dashboard → **Settings → Webhooks** → шинэ webhook үүсгэж URL-г `https://<домэйн>/api/mux/webhook` болгоно. Үүсгэсэн webhook-ийн **Signing secret**-г Vercel-ийн `MUX_WEBHOOK_SECRET` env var-тай ижил байлгана (шинээр үүсгэсэн бол Vercel дээрх утгыг шинэчилнэ).

## 5. AI файл-үүсгэх функцийг идэвхжүүлэх (заавал биш)

`ANTHROPIC_API_KEY`-г Vercel env var-т нэмээд дахин deploy хийхэд "Файлаас автоматаар үүсгэх" хэсэг автоматаар харагдана ([console.anthropic.com](https://console.anthropic.com)-оос key авна, картаа холбох шаардлагатай — pay-as-you-go).

Мөн [supabase/migration_ai_usage_logs.sql](supabase/migration_ai_usage_logs.sql)-г Supabase SQL Editor-т ажиллуулаагүй бол ажиллуулна (өдрийн хязгаарлалт идэвхжинэ).

## 6. Deploy хийсний дараа шалгах зүйлс

- [ ] `/register`-ээр шинэ хэрэглэгч бүртгүүлж, и-мэйл баталгаажуулалт ирж байгааг шалгах
- [ ] Google OAuth (хэрэв идэвхжүүлсэн бол) нэвтэрч байгааг шалгах
- [ ] Supabase Table Editor-с эхний хэрэглэгчийнхээ `profiles.role`-г `instructor` эсвэл `admin` болгож, `/admin/courses`-д орж курс үүсгэж шалгах
- [ ] Видео байршуулж, Mux webhook ирж `mux_playback_id` хадгалагдаж байгааг шалгах
- [ ] Хичээл үзэж, явц (progress) хадгалагдаж байгааг шалгах

## Хийгдээгүй үлдсэн (README-д тэмдэглэсэн)

- Stripe/QPay төлбөрийн интеграц (одоогоор зөвхөн үнэгүй элсэлт ажилладаг)
- Thumbnail/зураг upload (Supabase Storage)
- Автомат тест
