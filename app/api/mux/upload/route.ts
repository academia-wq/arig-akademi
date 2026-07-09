import { NextResponse, type NextRequest } from "next/server";
import Mux from "@mux/mux-node";
import { createClient } from "@/lib/supabase/server";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
  }

  const { lessonId } = await request.json();
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId шаардлагатай" }, { status: 400 });
  }

  // passthrough талбарт lessonId-г хадгалснаар webhook ирэхэд аль хичээлд
  // холбохоо мэдэх боломжтой болно (спек 4.2.4)
  const upload = await mux.video.uploads.create({
    cors_origin: process.env.NEXT_PUBLIC_SITE_URL || "*",
    new_asset_settings: {
      playback_policy: ["public"],
      passthrough: lessonId,
    },
  });

  // asset_id одоохондоо байхгүй тул upload.id-г түр хадгалж болно;
  // энгийн эсэхийн тулд webhook ирэхэд passthrough-оор lesson-г олно.
  return NextResponse.json({ uploadUrl: upload.url, uploadId: upload.id });
}
