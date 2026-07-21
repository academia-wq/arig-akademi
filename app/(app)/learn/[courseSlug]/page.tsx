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
  const firstLesson = modules?.[0]?.lessons?.sort(
    (a: any, b: any) => a.position - b.position
  )?.[0];

  if (!firstLesson) notFound();

  redirect(`/learn/${params.courseSlug}/${firstLesson.id}`);
}
