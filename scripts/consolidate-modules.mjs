// Тодорхой ЗЭРЭГЦЭЭ (position ХАРИЛЦАН ХАМААРАЛГҮЙ, DB-ээс шууд байдлаар) module_id
// жагсаалтыг нэг модуль болгож нэгтгэнэ. Position-оор БИШ, module id-аар ажилладаг тул
// давхар ажиллуулсан ч, өмнөх ажиллагаанаас болж бусад модулийн байрлал өөрчлөгдсөн ч
// буруу зүйл рүү хүрэхгүй ("position-based" хувилбар staleness-с болж алдаа гаргаж байсан).
//
// Ашиглах жишээ:
//   node --env-file=.env.local scripts/consolidate-modules.mjs <courseId> "Шинэ гарчиг" id1 id2 id3 ...
import { createClient } from "@supabase/supabase-js";

const [COURSE_ID, NEW_TITLE, ...MODULE_IDS] = process.argv.slice(2);

if (!COURSE_ID || !NEW_TITLE || MODULE_IDS.length < 2) {
  console.error(
    'Usage: node consolidate-modules.mjs <courseId> "Шинэ гарчиг" <moduleId1> <moduleId2> [...]'
  );
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: modules, error: modErr } = await supabase
    .from("modules")
    .select("id, title, course_id, position")
    .in("id", MODULE_IDS);
  if (modErr) throw modErr;

  const missing = MODULE_IDS.filter((id) => !modules.some((m) => m.id === id));
  if (missing.length) {
    throw new Error(`Module id(s) not found (already merged/deleted?): ${missing.join(", ")}`);
  }
  if (modules.some((m) => m.course_id !== COURSE_ID)) {
    throw new Error("One or more modules belong to a different course — aborting.");
  }

  const [target, ...rest] = modules.sort((a, b) => a.position - b.position);

  const { error: renameErr } = await supabase
    .from("modules")
    .update({ title: NEW_TITLE })
    .eq("id", target.id);
  if (renameErr) throw renameErr;

  const { count: targetLessonCount } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("module_id", target.id);
  let nextPos = targetLessonCount || 0;

  for (const src of rest) {
    const { data: lessons, error: lesErr } = await supabase
      .from("lessons")
      .select("id")
      .eq("module_id", src.id)
      .order("position");
    if (lesErr) throw lesErr;

    for (const lesson of lessons) {
      const { error: moveErr } = await supabase
        .from("lessons")
        .update({ module_id: target.id, position: nextPos })
        .eq("id", lesson.id);
      if (moveErr) throw moveErr;
      nextPos++;
    }

    const { error: delErr } = await supabase.from("modules").delete().eq("id", src.id);
    if (delErr) throw delErr;
  }

  console.log(`Merged ${modules.length} modules -> "${NEW_TITLE}" (${nextPos} lessons) [${target.id}]`);
}

main().catch((err) => {
  console.error("FATAL:", err.message || err);
  process.exit(1);
});
