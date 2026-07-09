import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

// Next.js-ийн route/chunk тус бүр @supabase/ssr-г тусад нь bundle хийж болзошгүй
// тул сан дотоод cache найдваргүй (module-scope хувьсагч route бүрт давхардаж
// болно). Тиймээс энд өөрсдөө singleton барьж, browser client-ийг бүх компонент
// зэрэг ашиглана — эс тэгвэл олон GoTrueClient instance зэрэг refresh хийж,
// "Invalid Refresh Token: Already Used" алдаа өгдөг.
let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}
