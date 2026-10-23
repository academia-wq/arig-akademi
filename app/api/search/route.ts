import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isModuleVisible } from "@/lib/module-visibility";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) {
    return NextResponse.json({ courses: [], lessons: [] });
  }

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("user_id", user.id);

  const enrolledIds = (enrollments || []).map((e) => e.course_id);

  if (enrolledIds.length === 0) {
    return NextResponse.json({ courses: [], lessons: [] });
  }

  // Хэрэглэгчид харагдах модультай бүлгүүдийг л хайна (хэлтэс, үндсэн/франчайз).
  const [{ data: viewer }, { data: enrolledModules }] = await Promise.all([
    supabase.from("profiles").select("position, department, role, employee_type").eq("id", user.id).single(),
    supabase
      .from("modules")
      .select("course_id, visible_positions, visible_departments, audience")
      .in("course_id", enrolledIds),
  ]);
  const courseIds = Array.from(
    new Set(
      (enrolledModules || []).filter((m) => isModuleVisible(m, viewer)).map((m) => m.course_id)
    )
  );
  if (courseIds.length === 0) {
    return NextResponse.json({ courses: [], lessons: [] });
  }

  const { data: courseMatches } = await supabase
    .from("courses")
    .select("id, title, slug")
    .in("id", courseIds)
    .ilike("title", `%${q}%`)
    .limit(5);

  const { data: lessonMatches } = await supabase
    .from("lessons")
    .select(
      "id, title, modules!inner(course_id, visible_positions, visible_departments, audience, courses!inner(slug, title))"
    )
    .in("modules.course_id", courseIds)
    .ilike("title", `%${q}%`)
    .limit(40);

  const courses = (courseMatches || []).map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
  }));

  const lessons = (lessonMatches || [])
    .filter((l: any) => isModuleVisible(l.modules, viewer))
    .slice(0, 8)
    .map((l: any) => ({
    id: l.id,
    title: l.title,
    courseSlug: l.modules.courses.slug,
    courseTitle: l.modules.courses.title,
  }));

  return NextResponse.json({ courses, lessons });
}
