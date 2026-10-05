export function formatCurrency(value: number | null | undefined): string {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const day = String(iso).slice(0, 10);
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return day;
  const parsed = new Date(year, month - 1, date);
  if (Number.isNaN(parsed.getTime())) return day;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function invoiceNumber(id: string): string {
  return `LM-${id.slice(0, 6).toUpperCase()}`;
}
