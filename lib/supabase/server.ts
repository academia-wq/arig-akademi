import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@/types/database.types";
import type { User } from "@supabase/supabase-js";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Component-с дуудагдвал бичих боломжгүй — middleware
            // session-ийг сэргээж байгаа тул үл тоомсорлож болно.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // дээрх шалтгаантай адил
          }
        },
      },
    }
  );
}

// Layout, page, action бүр createClient()-ээ дуудаад дотор нь дахин
// supabase.auth.getUser() дуудвал нэг л request дотор Supabase руу зэрэг
// хэдэн getUser() (болон шаардлагатай бол refresh) хүсэлт зэрэг явж,
// зөвхөн нэг нь ялж, үлдсэн нь "Invalid Refresh Token: Already Used"
// алдаатай null user буцаадаг байсан (жишээ нь (admin)/layout.tsx амжилттай
// нэвтрүүлсэн ч дараа нь admin/courses/page.tsx-ийн ӨӨРИЙН getUser() дуудлага
// null буцааж, `user!.id` дээр crash хийдэг байв). React-ийн cache()-ээр нэг
// request дотор ганц удаа л жинхэнэ сүлжээний дуудлага хийж, бусад бүх
// дуудлагууд үр дүнг нь дахин ашиглана.
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Зөвхөн серверийн дотоод ажилд (webhook, admin task) — RLS-г тойрно. */
export function createServiceRoleClient() {
  return createRawClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
