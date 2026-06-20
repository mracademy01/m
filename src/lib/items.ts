export type ParsedItem = {
  productId: number;
  qty: number;
  unitPrice: number;
};

export function parseItems(raw: FormDataEntryValue | null): ParsedItem[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(String(raw));
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const items: ParsedItem[] = [];
  for (const row of data) {
    if (typeof row !== "object" || row === null) continue;
    const r = row as Record<string, unknown>;
    const productId = Number(r.productId);
    const qty = Number(r.qty);
    const unitPrice = Number(r.unitPrice);
    if (!Number.isInteger(productId) || productId <= 0) continue;
    if (!Number.isFinite(qty) || qty <= 0) continue;
    items.push({
      productId,
      qty: Math.floor(qty),
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
    });
  }
  return items;
}
