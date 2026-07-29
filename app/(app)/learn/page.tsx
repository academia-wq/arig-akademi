import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";

export default async function LearnEntryPage() {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect("/login?redirect=/learn");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, courses(slug)")
    .eq("user_id", user.id);

  let courseSlugs = (enrollments || [])
    .map((e: any) => e.courses?.slug)
    .filter(Boolean);

  // Хэрэглэгч ямар ч курст элсээгүй бол одоо байгаа үнэгүй курсуудад
  // автоматаар элсүүлж, шууд суралцах руу шилжүүлнэ.
  if (courseSlugs.length === 0) {
    const { data: freeCourses } = await supabase
      .from("courses")
      .select("id, slug")
      .eq("is_published", true)
      .eq("price", 0);

    if (freeCourses && freeCourses.length > 0) {
      await supabase
        .from("enrollments")
        .upsert(
          freeCourses.map((c) => ({ user_id: user.id, course_id: c.id })),
          { onConflict: "user_id,course_id", ignoreDuplicates: true }
        );
      courseSlugs = freeCourses.map((c) => c.slug);
    }
  }

  if (courseSlugs.length === 1) {
    redirect(`/learn/${encodeURIComponent(courseSlugs[0])}`);
  }

  redirect("/dashboard");
}
