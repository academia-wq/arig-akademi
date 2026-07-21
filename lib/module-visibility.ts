export function isModuleVisible(
  visiblePositions: string[] | null | undefined,
  userPosition: string | null | undefined
): boolean {
  if (!visiblePositions || visiblePositions.length === 0) return true;
  if (!userPosition) return false;
  const normalized = userPosition.trim().toLowerCase();
  return visiblePositions.some((p) => p.trim().toLowerCase() === normalized);
}
