import { NextResponse, type NextRequest } from "next/server";
import Mux from "@mux/mux-node";
import { createServiceRoleClient } from "@/lib/supabase/server";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  let event;
  try {
    event = mux.webhooks.unwrap(
      rawBody,
      request.headers,
      process.env.MUX_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Хүчингүй signature" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Encode дуусахад ирэх event — lessons хүснэгтэд playback_id хадгална (спек 4.2.4)
  if (event.type === "video.asset.ready") {
    const asset = event.data;
    const lessonId = asset.passthrough;
    const playbackId = asset.playback_ids?.[0]?.id;

    if (lessonId && playbackId) {
      await supabase
        .from("lessons")
        .update({
          mux_playback_id: playbackId,
          mux_asset_id: asset.id,
          duration_seconds: asset.duration ? Math.round(asset.duration) : null,
        })
        .eq("id", lessonId);
    }
  }

  return NextResponse.json({ received: true });
}
