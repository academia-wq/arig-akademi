function matches(allowed: string[] | null | undefined, value: string | null | undefined) {
  if (!allowed || allowed.length === 0) return true; // хязгаарлаагүй
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return allowed.some((a) => a.trim().toLowerCase() === normalized);
}

// Модуль тухайн ажилтанд харагдах эсэх:
// - visible_departments / visible_positions хоосон бол хязгааргүй,
// - хоёулаа тохируулсан бол хоёуланд нь тохирсон үед л харагдана,
// - admin/instructor бүх модулийг харна (удирдах, шалгахын тулд).
export function isModuleVisible(
  mod: { visible_positions?: string[] | null; visible_departments?: string[] | null },
  user: { position?: string | null; department?: string | null; role?: string | null } | null | undefined
): boolean {
  if (user?.role === "admin" || user?.role === "instructor") return true;
  return (
    matches(mod.visible_departments, user?.department) &&
    matches(mod.visible_positions, user?.position)
  );
}
