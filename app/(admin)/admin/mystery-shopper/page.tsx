import { createClient } from "@/lib/supabase/server";
import { MysteryShopperResultsTable } from "@/components/mystery-shopper-results-table";

export default async function AdminMysteryShopperPage() {
  const supabase = createClient();
  const { data: evaluations } = await supabase
    .from("mystery_shopper_evaluations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Нууц үйлчлүүлэгч</h1>
      <p className="mt-1 text-sm text-ink/60">
        <a
          href="/mystery-shopper"
          target="_blank"
          rel="noreferrer"
          className="text-brand-700 underline hover:text-brand-500"
        >
          /mystery-shopper
        </a>{" "}
        хаягаар илгээсэн үнэлгээнүүд. Мөр дээр дарж дэлгэрэнгүйг харна уу.
      </p>
      <MysteryShopperResultsTable evaluations={evaluations ?? []} />
    </div>
  );
}
