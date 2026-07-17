import { createClient } from "@supabase/supabase-js";

const COURSE_ID = "a0a8f481-40d9-4af8-88f1-b4746b9255d0";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// [startPosition, endPosition, newConsolidatedTitle]
const MERGE_GROUPS = [
  [0, 2, "О-1 стандарт: Ажилтны гадаад төрх, хувцаслалтын стандарт"],
  [3, 9, "“АРИГ ИНТЕРНЭШНЛ” ХХК: Ажлын байрны тодорхойлолт"],
  [10, 13, "О-11 стандарт: Үйлчлүүлэгчийн гомдол шийдвэрлэлт"],
  [14, 18, "О-10 стандарт: Сургалтын менежмент"],
  [19, 22, "О-8 стандарт: Ерөнхий орчин, цэвэрлэгээний стандарт"],
  [28, 35, "Үйлчилгээний журам"],
  [36, 43, "Менежерийн үйл ажиллагааны стандарт"],
  [44, 51, "Бүсийн менежерийн үйл ажиллагааны стандарт"],
  [52, 57, "Хөдөлмөрийн аюулгүй байдал, эрсдэлийн зааварчилгаа"],
  [58, 60, "О-2 стандарт: Үйлчлүүлэгчийг угтах, захиалга, харилцааны стандарт"],
];

async function main() {
  const { data: modules, error: modErr } = await supabase
    .from("modules")
    .select("id, title, position")
    .eq("course_id", COURSE_ID)
    .order("position");
  if (modErr) throw modErr;

  for (const [start, end, newTitle] of MERGE_GROUPS) {
    const group = modules.filter((m) => m.position >= start && m.position <= end);
    if (group.length < 2) {
      console.log(`SKIP [${start}-${end}]: expected >=2 modules, found ${group.length}`);
      continue;
    }
    const [target, ...rest] = group;

    const { error: renameErr } = await supabase
      .from("modules")
      .update({ title: newTitle })
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

    console.log(`MERGED [${start}-${end}] -> "${newTitle}" (${nextPos} lessons)`);
  }

  const { data: remaining, error: remErr } = await supabase
    .from("modules")
    .select("id, position")
    .eq("course_id", COURSE_ID)
    .order("position");
  if (remErr) throw remErr;

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].position !== i) {
      const { error: posErr } = await supabase
        .from("modules")
        .update({ position: i })
        .eq("id", remaining[i].id);
      if (posErr) throw posErr;
    }
  }

  console.log(`\nDone. Final module count: ${remaining.length}`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
