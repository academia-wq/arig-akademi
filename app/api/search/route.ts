import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const courseIds = (enrollments || []).map((e) => e.course_id);

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
    .select("id, title, modules!inner(course_id, courses!inner(slug, title))")
    .in("modules.course_id", courseIds)
    .ilike("title", `%${q}%`)
    .limit(8);

  const courses = (courseMatches || []).map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
  }));

  const lessons = (lessonMatches || []).map((l: any) => ({
    id: l.id,
    title: l.title,
    courseSlug: l.modules.courses.slug,
    courseTitle: l.modules.courses.title,
  }));

  return NextResponse.json({ courses, lessons });
}
