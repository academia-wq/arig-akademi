"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import {
  academyStructureSchema,
  ACADEMY_STRUCTURE_ID,
  type AcademyStructure,
} from "@/lib/academy-structure/schema";

export async function saveStructure(
  data: AcademyStructure
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getUser();
  if (!user) return { success: false, error: "Нэвтрээгүй байна." };

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "instructor") {
    return { success: false, error: "Энэ үйлдэлд эрх хүрэлцэхгүй байна." };
  }

  const parsed = academyStructureSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Өгөгдлийн бүтэц буруу байна." };
  }

  const { error } = await supabase
    .from("academy_structure")
    .update({
      data: parsed.data,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ACADEMY_STRUCTURE_ID);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/structure");
  return { success: true };
}
