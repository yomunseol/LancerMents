export const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  zh: "zh-CN",
  es: "es-ES",
  fr: "fr-FR",
  ar: "ar-EG",
  pt: "pt-BR",
  ru: "ru-RU",
  de: "de-DE",
  ja: "ja-JP",
  ko: "ko-KR",
  sw: "sw-KE",
  it: "it-IT",
  he: "he-IL",
  af: "af-ZA",
  ga: "ga-IE",
};

export function intlLocale(locale?: string | null): string {
  return (locale && LOCALE_MAP[locale]) || "en-US";
}

export function formatCurrency(
  value: number | null | undefined,
  locale?: string | null,
): string {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount);
}

export function formatDate(
  iso: string | null | undefined,
  locale?: string | null,
): string {
  if (!iso) return "—";
  const day = String(iso).slice(0, 10);
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return day;
  const parsed = new Date(year, month - 1, date);
  if (Number.isNaN(parsed.getTime())) return day;
  return parsed.toLocaleDateString(intlLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelative(
  iso: string | null | undefined,
  locale?: string | null,
): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
  const minutes = Math.round((then - Date.now()) / 60000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  return rtf.format(Math.round(hours / 24), "day");
}

export function invoiceNumber(id: string): string {
  return `LM-${id.slice(0, 6).toUpperCase()}`;
}
