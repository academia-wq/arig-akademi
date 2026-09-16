export function initialsOf(name: string | null, email: string | null): string {
  const source = (name || "").trim();
  if (source) {
    const parts = source.split(/\s+/).filter(Boolean);
    const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase());
    if (letters.length) return letters.join("");
  }
  return (email || "?")[0]?.toUpperCase() || "?";
}

export function formatMonthRange(date: Date): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const lastDay = new Date(year, month, 0).getDate();
  return `${month}-р сарын 1 - ${month}-р сарын ${lastDay}, ${year}`;
}

const MONTHS_MN = [
  "1-р сар",
  "2-р сар",
  "3-р сар",
  "4-р сар",
  "5-р сар",
  "6-р сар",
  "7-р сар",
  "8-р сар",
  "9-р сар",
  "10-р сар",
  "11-р сар",
  "12-р сар",
];

export function formatJoinDate(isoDate: string): string {
  const date = new Date(isoDate);
  return `${date.getFullYear()} оны ${MONTHS_MN[date.getMonth()]}-д элссэн`;
}

export function formatCompletedDate(isoDate: string): string {
  const date = new Date(isoDate);
  return `${date.getFullYear()} оны ${MONTHS_MN[date.getMonth()]}-ийн ${date.getDate()}`;
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "дөнгөж сая";
  if (diffMinutes < 60) return `${diffMinutes} минут өмнө`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} цаг өмнө`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} өдөр өмнө`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} сар өмнө`;
}

export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "";

  const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} мин`;
  if (minutes === 0) return `${hours} цаг`;
  return `${hours} цаг ${minutes} мин`;
}
