import type { AcademyStructure } from "@/lib/academy-structure/schema";

function daysUntil(dateStr: string): number | null {
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function AcademyStructureView({ structure }: { structure: AcademyStructure }) {
  const remaining = daysUntil(structure.deadline);

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
          Ариг Академи
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
          Сургалтын бүтэц ба хариуцагчид
        </h2>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="rounded-full border border-ink/10 bg-paper px-4 py-1.5 text-xs">
            <span className="text-ink/40">Хариуцагч </span>
            <span className="font-semibold text-ink">
              {structure.owner.name} — {structure.owner.role}
            </span>
          </span>
          <span className="rounded-full border border-ink/10 bg-paper px-4 py-1.5 text-xs">
            <span className="text-ink/40">Эцсийн хугацаа </span>
            <span className="font-semibold text-brand-500">{structure.deadline}</span>
            {remaining !== null && (
              <span className="text-ink/40"> · ~{remaining} хоног үлдсэн</span>
            )}
          </span>
          <span className="rounded-full border border-ink/10 bg-paper px-4 py-1.5 text-xs">
            <span className="text-ink/40">Гарц </span>
            <span className="font-semibold text-ink">{structure.output}</span>
          </span>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div>
          <div className="text-center">
            <span className="inline-block rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Баг — бүрэлдэхүүн
            </span>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">
              Бүсийн 5 менежер
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {structure.regionalManagers.map((person, i) => (
                <div key={i} className="rounded-md border border-ink/10 p-2.5 shadow-sm">
                  <p className="text-sm font-semibold text-ink">{person.name}</p>
                  {person.focus ? (
                    <p className="mt-0.5 text-xs text-ink/60">{person.focus}</p>
                  ) : (
                    <span className="mt-1 inline-block rounded border border-dashed border-ink/25 px-1.5 py-0.5 text-[10px] uppercase text-ink/40">
                      чиглэл тодорхойлох
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">
              Чиглэл хариуцагчид
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {structure.domainLeads.map((lead, i) => (
                <div key={i} className="rounded-md border border-ink/10 p-2.5 shadow-sm">
                  <p className="text-sm font-semibold text-brand-700">{lead.domain}</p>
                  <p className="mt-0.5 text-xs text-ink/60">
                    {lead.role} {lead.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="text-center">
            <span className="inline-block rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Сургалтын материал — 2 төрөл
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {structure.materials.map((panel) => {
              const isOchre = panel.color === "ochre";
              return (
                <div
                  key={panel.key}
                  className={
                    isOchre
                      ? "rounded-lg border border-brand-100 bg-brand-50 p-4"
                      : "rounded-lg border border-accent/20 bg-accent/5 p-4"
                  }
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={
                        isOchre
                          ? "h-2.5 w-2.5 rounded-full bg-brand-500"
                          : "h-2.5 w-2.5 rounded-full bg-accent"
                      }
                    />
                    <h3
                      className={
                        isOchre
                          ? "font-display text-lg font-semibold text-brand-700"
                          : "font-display text-lg font-semibold text-accent"
                      }
                    >
                      {panel.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {panel.branches.map((branch, bi) => (
                      <div key={bi} className="min-w-[160px] flex-1">
                        <p className="rounded-md border border-ink/10 bg-white px-2.5 py-1.5 text-sm font-semibold shadow-sm">
                          {branch.title}
                        </p>
                        {branch.items.length > 0 && (
                          <ul className="mt-2 space-y-1.5 border-l border-dashed border-ink/20 pl-2.5">
                            {branch.items.map((item, ii) => (
                              <li
                                key={ii}
                                className="rounded-md border border-ink/10 bg-white px-2 py-1.5 text-xs text-ink/70 shadow-sm"
                              >
                                {item.label}
                                {item.sub && (
                                  <span className="mt-0.5 block text-[10px] text-ink/40">
                                    {item.sub}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
