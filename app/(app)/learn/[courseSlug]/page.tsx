import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LearnCourseEntryPage({
  params,
}: {
  params: { courseSlug: string };
}) {
  const supabase = createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, modules(id, position, lessons(id, position))")
    .eq("slug", params.courseSlug)
    .single();

  if (!course) notFound();

  const modules = (course as any).modules?.sort(
    (a: any, b: any) => a.position - b.position
  );
  const firstLesson = modules?.[0]?.lessons?.sort(
    (a: any, b: any) => a.position - b.position
  )?.[0];

  if (!firstLesson) notFound();

  redirect(`/learn/${params.courseSlug}/${firstLesson.id}`);
}
