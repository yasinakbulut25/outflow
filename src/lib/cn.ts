// Basit className birleştirici (clsx ihtiyacını karşılar).
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
