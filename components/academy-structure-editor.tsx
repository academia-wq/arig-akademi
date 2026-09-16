"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AcademyStructure } from "@/lib/academy-structure/schema";
import { saveStructure } from "@/app/(admin)/admin/structure/actions";

const inputClass =
  "focus-ring w-full rounded-md border border-ink/15 px-2.5 py-1.5 text-sm";
const labelClass = "block text-xs font-medium text-ink/60";

export function AcademyStructureEditor({
  initial,
  onDone,
}: {
  initial: AcademyStructure;
  onDone: () => void;
}) {
  const router = useRouter();
  const [structure, setStructure] = useState<AcademyStructure>(initial);
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startSaving(async () => {
      const result = await saveStructure(structure);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
      onDone();
    });
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Хариуцагчийн нэр</label>
          <input
            value={structure.owner.name}
            onChange={(e) =>
              setStructure({ ...structure, owner: { ...structure.owner, name: e.target.value } })
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Хариуцагчийн албан тушаал</label>
          <input
            value={structure.owner.role}
            onChange={(e) =>
              setStructure({ ...structure, owner: { ...structure.owner, role: e.target.value } })
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Эцсийн хугацаа</label>
          <input
            type="date"
            value={structure.deadline}
            onChange={(e) => setStructure({ ...structure, deadline: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Гарц</label>
          <input
            value={structure.output}
            onChange={(e) => setStructure({ ...structure, output: e.target.value })}
            className={inputClass}
          />
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Бүсийн менежерүүд</h3>
          <button
            type="button"
            onClick={() =>
              setStructure({
                ...structure,
                regionalManagers: [...structure.regionalManagers, { name: "", focus: "" }],
              })
            }
            className="text-xs font-medium text-brand-500 hover:underline"
          >
            + Нэмэх
          </button>
        </div>
        <div className="space-y-2">
          {structure.regionalManagers.map((person, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="Нэр"
                value={person.name}
                onChange={(e) => {
                  const list = [...structure.regionalManagers];
                  list[i] = { ...list[i], name: e.target.value };
                  setStructure({ ...structure, regionalManagers: list });
                }}
                className={inputClass + " flex-1"}
              />
              <input
                placeholder="Хариуцах чиглэл (заавал биш)"
                value={person.focus}
                onChange={(e) => {
                  const list = [...structure.regionalManagers];
                  list[i] = { ...list[i], focus: e.target.value };
                  setStructure({ ...structure, regionalManagers: list });
                }}
                className={inputClass + " flex-1"}
              />
              <button
                type="button"
                onClick={() =>
                  setStructure({
                    ...structure,
                    regionalManagers: structure.regionalManagers.filter((_, j) => j !== i),
                  })
                }
                className="text-xs text-red-600 hover:underline"
              >
                Устгах
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Чиглэл хариуцагчид</h3>
          <button
            type="button"
            onClick={() =>
              setStructure({
                ...structure,
                domainLeads: [...structure.domainLeads, { domain: "", role: "", name: "" }],
              })
            }
            className="text-xs font-medium text-brand-500 hover:underline"
          >
            + Нэмэх
          </button>
        </div>
        <div className="space-y-2">
          {structure.domainLeads.map((lead, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="Чиглэл"
                value={lead.domain}
                onChange={(e) => {
                  const list = [...structure.domainLeads];
                  list[i] = { ...list[i], domain: e.target.value };
                  setStructure({ ...structure, domainLeads: list });
                }}
                className={inputClass + " flex-1"}
              />
              <input
                placeholder="Албан тушаал"
                value={lead.role}
                onChange={(e) => {
                  const list = [...structure.domainLeads];
                  list[i] = { ...list[i], role: e.target.value };
                  setStructure({ ...structure, domainLeads: list });
                }}
                className={inputClass + " flex-1"}
              />
              <input
                placeholder="Нэр"
                value={lead.name}
                onChange={(e) => {
                  const list = [...structure.domainLeads];
                  list[i] = { ...list[i], name: e.target.value };
                  setStructure({ ...structure, domainLeads: list });
                }}
                className={inputClass + " flex-1"}
              />
              <button
                type="button"
                onClick={() =>
                  setStructure({
                    ...structure,
                    domainLeads: structure.domainLeads.filter((_, j) => j !== i),
                  })
                }
                className="text-xs text-red-600 hover:underline"
              >
                Устгах
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-sm font-semibold text-ink">Сургалтын материал</h3>
        {structure.materials.map((panel, pi) => (
          <div key={panel.key} className="rounded-md border border-ink/10 p-3">
            <input
              value={panel.title}
              onChange={(e) => {
                const materials = [...structure.materials];
                materials[pi] = { ...materials[pi], title: e.target.value };
                setStructure({ ...structure, materials });
              }}
              className={inputClass + " font-semibold"}
            />

            <div className="mt-3 space-y-3">
              {panel.branches.map((branch, bi) => (
                <div key={bi} className="rounded-md bg-ink/5 p-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      placeholder="Салбарын нэр"
                      value={branch.title}
                      onChange={(e) => {
                        const materials = [...structure.materials];
                        const branches = [...materials[pi].branches];
                        branches[bi] = { ...branches[bi], title: e.target.value };
                        materials[pi] = { ...materials[pi], branches };
                        setStructure({ ...structure, materials });
                      }}
                      className={inputClass + " flex-1 bg-white"}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const materials = [...structure.materials];
                        materials[pi] = {
                          ...materials[pi],
                          branches: materials[pi].branches.filter((_, j) => j !== bi),
                        };
                        setStructure({ ...structure, materials });
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Салбар устгах
                    </button>
                  </div>

                  <div className="mt-2 space-y-1.5 pl-3">
                    {branch.items.map((item, ii) => (
                      <div key={ii} className="flex gap-2">
                        <input
                          placeholder="Гарчиг"
                          value={item.label}
                          onChange={(e) => {
                            const materials = [...structure.materials];
                            const branches = [...materials[pi].branches];
                            const items = [...branches[bi].items];
                            items[ii] = { ...items[ii], label: e.target.value };
                            branches[bi] = { ...branches[bi], items };
                            materials[pi] = { ...materials[pi], branches };
                            setStructure({ ...structure, materials });
                          }}
                          className={inputClass + " flex-1 bg-white"}
                        />
                        <input
                          placeholder="Тайлбар (заавал биш)"
                          value={item.sub}
                          onChange={(e) => {
                            const materials = [...structure.materials];
                            const branches = [...materials[pi].branches];
                            const items = [...branches[bi].items];
                            items[ii] = { ...items[ii], sub: e.target.value };
                            branches[bi] = { ...branches[bi], items };
                            materials[pi] = { ...materials[pi], branches };
                            setStructure({ ...structure, materials });
                          }}
                          className={inputClass + " flex-1 bg-white"}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const materials = [...structure.materials];
                            const branches = [...materials[pi].branches];
                            branches[bi] = {
                              ...branches[bi],
                              items: branches[bi].items.filter((_, j) => j !== ii),
                            };
                            materials[pi] = { ...materials[pi], branches };
                            setStructure({ ...structure, materials });
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Устгах
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const materials = [...structure.materials];
                        const branches = [...materials[pi].branches];
                        branches[bi] = {
                          ...branches[bi],
                          items: [...branches[bi].items, { label: "", sub: "" }],
                        };
                        materials[pi] = { ...materials[pi], branches };
                        setStructure({ ...structure, materials });
                      }}
                      className="text-xs font-medium text-brand-500 hover:underline"
                    >
                      + Дэд зүйл нэмэх
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const materials = [...structure.materials];
                  materials[pi] = {
                    ...materials[pi],
                    branches: [...materials[pi].branches, { title: "", items: [] }],
                  };
                  setStructure({ ...structure, materials });
                }}
                className="text-xs font-medium text-brand-500 hover:underline"
              >
                + Салбар нэмэх
              </button>
            </div>
          </div>
        ))}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 border-t border-ink/10 pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="focus-ring rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isSaving ? "Хадгалж байна..." : "Хадгалах"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={isSaving}
          className="focus-ring rounded-md border border-ink/15 px-4 py-2 text-sm font-medium hover:border-ink/30"
        >
          Цуцлах
        </button>
      </div>
    </div>
  );
}
