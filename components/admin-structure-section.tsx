import { createClient } from "@/lib/supabase/server";
import { academyStructureSchema, ACADEMY_STRUCTURE_ID } from "@/lib/academy-structure/schema";
import { AcademyStructurePanel } from "@/components/academy-structure-panel";

export async function AdminStructureSection() {
  const supabase = createClient();
  const { data: row } = await supabase
    .from("academy_structure")
    .select("data")
    .eq("id", ACADEMY_STRUCTURE_ID)
    .single();

  const parsed = row ? academyStructureSchema.safeParse(row.data) : null;

  return (
    <div>
      <p className="mb-4 text-sm text-ink/60">
        Ариг Академийн багийн бүрэлдэхүүн, чиглэл хариуцагчид, сургалтын материалын бүтэц.
      </p>
      {parsed?.success ? (
        <AcademyStructurePanel initial={parsed.data} />
      ) : (
        <p className="rounded-2xl border border-ink/15 bg-white p-6 text-sm text-ink/60">
          Бүтцийн мэдээлэл олдсонгүй. Supabase дээр `add_academy_structure.sql` migration-ийг
          ажиллуулсан эсэхээ шалгана уу.
        </p>
      )}
    </div>
  );
}
