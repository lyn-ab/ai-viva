// lib/course-utils.ts
// Shared helpers extracted from the old monolithic course-detail component.
// Pure functions — safe to import anywhere.

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}

export function relativeTime(iso: string) {
  const elapsed = Date.now() - new Date(iso).getTime();
  const hours = Math.max(1, Math.round(elapsed / 3_600_000));
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function formatDate(iso: string) {
  if (!iso) return "Not set";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00`));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function durationLabel(start: string, end: string) {
  const minutes = Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000),
  );
  return `${minutes} min`;
}

export function progressPercent(value: number, total: number) {
  return total === 0 ? 0 : Math.min(100, Math.round((value / total) * 100));
}

export function safeFileName(file: File) {
  return file.name.length > 46 ? `${file.name.slice(0, 42)}…` : file.name;
}