import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";

async function updateProfile(formData: FormData) {
  "use server";

  const supabase = createClient();
  const user = await getUser();

  if (!user) return;

  const fullName = formData.get("full_name") as string;

  await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  revalidatePath("/settings");
}

export default async function SettingsPage() {
  const supabase = createClient();
  const user = await getUser();

  if (!user) {
    return <div>Та нэвтэрнэ үү.</div>;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl font-bold text-ink">Тохиргоо</h1>

      <form action={updateProfile} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink">И-мэйл</label>
          <input
            disabled
            value={user.email ?? ""}
            className="mt-1 w-full rounded-md border border-ink/10 bg-ink/5 px-3 py-2 text-ink/50"
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium text-ink"
            htmlFor="full_name"
          >
            Бүтэн нэр
          </label>

          <input
            id="full_name"
            name="full_name"
            defaultValue={profile?.full_name ?? ""}
            className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="focus-ring rounded-md bg-brand-500 px-4 py-2.5 font-medium text-white hover:bg-brand-700"
        >
          Хадгалах
        </button>
      </form>
    </div>
  );
}