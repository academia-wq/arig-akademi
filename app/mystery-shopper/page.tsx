import type { Metadata } from "next";
import { MysteryShopperForm } from "@/components/mystery-shopper-form";

export const metadata: Metadata = {
  title: "Нууц үйлчлүүлэгч — Үйлчилгээний үнэлгээ",
};

export default function MysteryShopperPage() {
  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <MysteryShopperForm />
      </div>
    </main>
  );
}
