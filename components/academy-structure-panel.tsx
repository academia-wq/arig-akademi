"use client";

import { useState } from "react";
import type { AcademyStructure } from "@/lib/academy-structure/schema";
import { AcademyStructureView } from "@/components/academy-structure-view";
import { AcademyStructureEditor } from "@/components/academy-structure-editor";

export function AcademyStructurePanel({ initial }: { initial: AcademyStructure }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="rounded-lg border border-ink/10 bg-white p-6">
        <AcademyStructureEditor initial={initial} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="focus-ring rounded-md border border-ink/15 px-3 py-1.5 text-sm font-medium hover:border-ink/30"
        >
          Засварлах
        </button>
      </div>
      <AcademyStructureView structure={initial} />
    </div>
  );
}
