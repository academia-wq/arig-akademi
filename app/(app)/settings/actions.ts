"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient, getUser } from "@/lib/supabase/server";

const SUPPORTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const user = await getUser();
  if (!user) return;

  const fullName = formData.get("full_name") as string;
  const position = formData.get("position") as string;

  await supabase
    .from("profiles")
    .update({ full_name: fullName, position })
    .eq("id", user.id);

  revalidatePath("/settings");
}

export async function uploadAvatar(
  formData: FormData
): Promise<{ success: true; avatarUrl: string } | { success: false; error: string }> {
  const user = await getUser();
  if (!user) return { success: false, error: "Нэвтрээгүй байна." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Зураг сонгоно уу." };
  }
  if (!SUPPORTED_IMAGE_MIME_TYPES.includes(file.type)) {
    return { success: false, error: "Зөвхөн JPEG, PNG, WEBP эсвэл GIF зураг дэмжигдэнэ." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { success: false, error: "Зурагны хэмжээ 8MB-с хэтэрсэн байна." };
  }

  const admin = createServiceRoleClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}-${Date.now()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: publicUrlData } = admin.storage.from("avatars").getPublicUrl(path);

  const { error: updateError } = await admin
    .from("profiles")
    .update({ avatar_url: publicUrlData.publicUrl })
    .eq("id", user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true, avatarUrl: publicUrlData.publicUrl };
}
