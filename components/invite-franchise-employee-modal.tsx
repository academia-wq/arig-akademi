"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "@/components/icons";
import { inviteFranchiseEmployee } from "@/app/(app)/franchise/actions";
import { DEPARTMENTS, POSITIONS } from "@/lib/departments";

// Франчайзын самбарын "Ажилтан нэмэх": ажилтан автоматаар энэ франчайзад харьяалагдана.
export function InviteFranchiseEmployeeButton({
  franchiseId,
  franchiseName,
}: {
  franchiseId: string;
  franchiseName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [position, setPosition] = useState(POSITIONS[DEPARTMENTS[0]][0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    name: string;
    email: string;
    link: string;
    emailed: boolean;
    resent: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  function close() {
    setOpen(false);
    setFullName("");
    setEmail("");
    setDepartment(DEPARTMENTS[0]);
    setPosition(POSITIONS[DEPARTMENTS[0]][0]);
    setError(null);
    setCreated(null);
    setCopied(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError("Нэр, имэйлээ оруулна уу.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.set("franchiseId", franchiseId);
    formData.set("fullName", fullName.trim());
    formData.set("email", email.trim());
    formData.set("department", department);
    formData.set("position", position);
    const result = await inviteFranchiseEmployee(formData);
    setSubmitting(false);
    if (result.success) {
      setCreated({
        name: fullName.trim(),
        email: email.trim(),
        link: result.link,
        emailed: result.emailed,
        resent: result.resent,
      });
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  async function copyLink() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0px_0px_2px_rgba(248,123,79,0.5)] transition hover:bg-brand-700"
      >
        Ажилтан нэмэх
        <PlusIcon className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 py-10"
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="my-auto w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <div>
                <p className="text-lg text-ink">Ажилтан нэмэх</p>
                <p className="text-xs text-ink/50">{franchiseName} франчайз</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Хаах"
                className="focus-ring flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-brand-500 text-brand-500 hover:bg-brand-50"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            {created ? (
              <div className="mt-5 flex flex-col gap-4">
                <div className="rounded-lg bg-brand-50 p-4 text-sm text-ink">
                  <p className="font-medium">
                    ✓ {created.name} {created.resent ? "— шинэ холбоос үүслээ" : "ажилтныг нэмлээ"}
                  </p>
                  <p className="mt-1 text-ink/60">
                    {created.emailed
                      ? `Нууц үг тохируулах холбоосыг ${created.email} хаяг руу илгээлээ.`
                      : "Доорх холбоосыг хуулж ажилтанд (Messenger, чат г.м.-ээр) өгнө үү."}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink">Нууц үг тохируулах холбоос</label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      readOnly
                      value={created.link}
                      onFocus={(e) => e.target.select()}
                      className="focus-ring w-full min-w-0 rounded-md border border-ink/15 bg-paper px-3 py-2.5 text-xs text-ink/70"
                    />
                    <button
                      type="button"
                      onClick={copyLink}
                      className="focus-ring flex-shrink-0 rounded-md bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-700"
                    >
                      {copied ? "Хуулсан" : "Хуулах"}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-ink/50">
                    Холбоос хугацаатай, нэг удаа ашиглагдана. Хүчингүй болсон бол ижил имэйлээр дахин
                    нэмэхэд шинэ холбоос үүснэ.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="focus-ring mt-2 rounded-md border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink/30"
                >
                  Хаах
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink">Овог нэр</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Жишээ: Бат Болд"
                    className="focus-ring mt-1.5 w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink">Имэйл</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ажилтан@gmail.com"
                    className="focus-ring mt-1.5 w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm text-ink"
                  />
                </div>

                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                  {DEPARTMENTS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDepartment(d);
                        setPosition(POSITIONS[d][0]);
                      }}
                      className={`focus-ring flex-auto whitespace-nowrap rounded-md border px-2 py-1.5 text-sm font-medium transition ${
                        department === d
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-ink/15 text-ink/60 hover:border-ink/30"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink">Албан тушаал</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="focus-ring mt-1.5 w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm text-ink"
                  >
                    {POSITIONS[department].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={close}
                    className="focus-ring flex-1 rounded-md border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink/30"
                  >
                    Болих
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="focus-ring flex-1 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0px_0px_2px_rgba(248,123,79,0.5)] transition hover:bg-brand-700 disabled:opacity-60"
                  >
                    {submitting ? "Нэмж байна..." : "Нэмэх"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
