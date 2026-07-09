import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/dashboard", "/learn", "/settings", "/admin"];

export async function middleware(request: NextRequest) {
  // Next.js Link-ийн prefetch хүсэлтүүд (hover дээр автоматаар ачаалагддаг)
  // жинхэнэ navigation хүсэлттэй зэрэг ирж, Supabase session refresh-г
  // давхар зэрэг өдөөж болзошгүй тул тэдгээрийг алгасна.
  if (request.headers.get("next-router-prefetch") === "1") {
    return NextResponse.next();
  }

  // Server Action хүсэлтүүд ("next-action" header-тэй): middleware энд
  // Supabase session-г дахин рефреш хийж, шинэ cookie-тэй response
  // үүсгэвэл, Next.js-ийн action response-ийг redirect хийх/forward хийх
  // дотоод механизмтай мөргөлддөг ("failed to forward action response:
  // fetch failed"), мөн middleware болон action хоёулаа зэрэг ижил
  // refresh token-ийг эргэлтэд оруулах гэж оролдвол Supabase
  // "Invalid Refresh Token: Already Used" алдаа буцаадаг. Action бүр
  // өөрөө supabase.auth.getUser()-ээр auth шалгадаг тул middleware энд
  // оролцох шаардлагагүй (Next.js-ийн зөвлөмжийн дагуу).
  if (request.headers.has("next-action")) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
