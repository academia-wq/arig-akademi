import { NextResponse, type NextRequest } from "next/server";
import Mux from "@mux/mux-node";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

// Webhook-ийн нөөц арга: хичээлд хуулсан видео Mux дээр бэлэн болсон эсэхийг шалгаж,
// бэлэн бол playback_id-г хичээлд холбоно. Webhook ажиллахгүй үед ч видео харагдана.
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" && profile?.role !== "instructor") {
    return NextResponse.json({ error: "Эрх хүрэлцэхгүй байна" }, { status: 403 });
  }

  const { lessonId } = await request.json();
  if (!lessonId) return NextResponse.json({ error: "lessonId шаардлагатай" }, { status: 400 });

  // Mux passthrough-оор шүүх боломжгүй тул сүүлийн asset-уудаас хайна (шинэ нь эхэндээ).
  const page = await mux.video.assets.list({ limit: 100 });
  const asset = page.data.find((a) => a.passthrough === lessonId);
  if (!asset) return NextResponse.json({ status: "not_found" });
  if (asset.status !== "ready") return NextResponse.json({ status: asset.status });

  const playbackId = asset.playback_ids?.[0]?.id;
  if (!playbackId) return NextResponse.json({ status: "no_playback_id" });

  const { error } = await createServiceRoleClient()
    .from("lessons")
    .update({
      mux_playback_id: playbackId,
      mux_asset_id: asset.id,
      duration_seconds: asset.duration ? Math.round(asset.duration) : null,
    })
    .eq("id", lessonId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ status: "ready", playbackId });
}
