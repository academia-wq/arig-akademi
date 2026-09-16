import { createClient } from "@/lib/supabase/server";
import { academyStructureSchema, ACADEMY_STRUCTURE_ID } from "@/lib/academy-structure/schema";
import { AcademyStructurePanel } from "@/components/academy-structure-panel";

export default async function AdminStructurePage() {
  const supabase = createClient();
  const { data: row } = await supabase
    .from("academy_structure")
    .select("data")
    .eq("id", ACADEMY_STRUCTURE_ID)
    .single();

  const parsed = row ? academyStructureSchema.safeParse(row.data) : null;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Академийн бүтэц</h1>
      <p className="mt-1 text-sm text-ink/60">
        Ариг Академийн багийн бүрэлдэхүүн, чиглэл хариуцагчид, сургалтын материалын бүтэц.
      </p>

      <div className="mt-6">
        {parsed?.success ? (
          <AcademyStructurePanel initial={parsed.data} />
        ) : (
          <p className="rounded-lg border border-ink/10 bg-white p-6 text-sm text-ink/60">
            Бүтцийн мэдээлэл олдсонгүй. Supabase дээр `add_academy_structure.sql` migration-ийг
            ажиллуулсан эсэхээ шалгана уу.
          </p>
        )}
      </div>
    </div>
  );
}
