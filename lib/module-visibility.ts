
function matches(allowed: string[] | null | undefined, value: string | null | undefined) {
  if (!allowed || allowed.length === 0) return true; // хязгаарлаагүй
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return allowed.some((a) => a.trim().toLowerCase() === normalized);
}

export type Audience = "core" | "franchise" | "all";

export const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "core", label: "Үндсэн" },
  { value: "franchise", label: "Франчайз" },
  { value: "all", label: "Хоёулаа" },
];

export function audienceLabel(audience: string | null | undefined) {
  return AUDIENCES.find((a) => a.value === audience)?.label ?? "Үндсэн";
}

type Viewer = {
  position?: string | null;
  department?: string | null;
  role?: string | null;
  employee_type?: string | null;
} | null | undefined;

// Кодгүй бүртгүүлж, админ албан тушаал оноогоогүй үндсэн ажилтан —
// франчайзын хүн кодгүй бүртгүүлээд үндсэн сургалт үзэхээс сэргийлж
// админ батлах хүртэл сургалт харуулахгүй.
export function isPendingViewer(user: Viewer) {
  if (!user || user.role === "admin" || user.role === "instructor") return false;
  return user.employee_type !== "franchise" && !user.position;
}

// Модуль тухайн ажилтанд харагдах эсэх:
// - audience: үндсэн ажилтан "core"/"all", франчайзын ажилтан "franchise"/"all"-ийг харна,
// - visible_departments / visible_positions хоосон бол хязгааргүй,
// - хоёулаа тохируулсан бол хоёуланд нь тохирсон үед л харагдана,
// - admin/instructor бүх модулийг харна (удирдах, шалгахын тулд).
export function isModuleVisible(
  mod: {
    visible_positions?: string[] | null;
    visible_departments?: string[] | null;
    audience?: string | null;
  },
  user: Viewer
): boolean {
  if (user?.role === "admin" || user?.role === "instructor") return true;
  if (isPendingViewer(user)) return false;
  const viewerType = user?.employee_type === "franchise" ? "franchise" : "core";
  const audience = mod.audience || "core";
  if (audience !== "all" && audience !== viewerType) return false;
  return (
    matches(mod.visible_departments, user?.department) &&
    matches(mod.visible_positions, user?.position)
  );
}
