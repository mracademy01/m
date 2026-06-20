export function formatMoney(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return (
    n.toLocaleString("ar-EG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }) + " ج.م"
  );
}

export function formatNumber(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return n.toLocaleString("ar-EG");
}

export function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
