import { notFound, redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { isModuleVisible } from "@/lib/module-visibility";

export default async function LearnCourseEntryPage({
  params,
}: {
  params: { courseSlug: string };
}) {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect(`/login?redirect=/learn/${params.courseSlug}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("position")
    .eq("id", user.id)
    .single();

  const { data: course } = await supabase
    .from("courses")
    .select("id, modules(id, position, visible_positions, lessons(id, position))")
    .eq("slug", decodeURIComponent(params.courseSlug))
    .single();

  if (!course) notFound();

  const modules = (course as any).modules
    ?.filter((m: any) => isModuleVisible(m.visible_positions, profile?.position))
    .sort((a: any, b: any) => a.position - b.position);

  const allLessons = (modules || [])
    .flatMap((m: any) =>
      [...(m.lessons || [])].sort((a: any, b: any) => a.position - b.position)
    );

  if (allLessons.length === 0) notFound();

  const { data: progressRows } = await supabase
    .from("lesson_progress")
    .select("lesson_id, is_completed")
    .eq("user_id", user.id)
    .eq("is_completed", true);

  const completedIds = new Set((progressRows || []).map((p) => p.lesson_id));
  const resumeLesson =
    allLessons.find((l: any) => !completedIds.has(l.id)) || allLessons[0];

  redirect(`/learn/${params.courseSlug}/${resumeLesson.id}`);
}
