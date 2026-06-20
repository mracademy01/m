"use client";

import { useState, type ReactNode } from "react";
import { SubmitButton } from "@/components/ui";
import { formatMoney } from "@/lib/format";

export type ProductOption = {
  id: number;
  name: string;
  costPrice: number;
  sellPrice: number;
  stock?: number;
  availableQty?: number; // الكمية المتاحة في المصدر (للتيم مثلاً)
};

type Line = {
  key: number;
  productId: number | "";
  qty: string;
  unitPrice: string;
};

type Action = (formData: FormData) => void | Promise<void>;

export default function LineItemsForm({
  products,
  action,
  priceMode,
  header,
  submitLabel,
  showTotal = true,
}: {
  products: ProductOption[];
  action: Action;
  // cost: سعر التكلفة, sell: سعر البيع, none: بدون سعر
  priceMode: "cost" | "sell" | "none";
  header?: ReactNode;
  submitLabel: string;
  showTotal?: boolean;
}) {
  const [lines, setLines] = useState<Line[]>([
    { key: 1, productId: "", qty: "", unitPrice: "" },
  ]);

  const defaultPrice = (productId: number) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return "";
    if (priceMode === "cost") return String(p.costPrice);
    if (priceMode === "sell") return String(p.sellPrice);
    return "";
  };

  const setLine = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const addLine = () =>
    setLines((ls) => [
      ...ls,
      { key: Math.max(0, ...ls.map((l) => l.key)) + 1, productId: "", qty: "", unitPrice: "" },
    ]);

  const removeLine = (key: number) =>
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls));

  const validLines = lines.filter(
    (l) => l.productId !== "" && Number(l.qty) > 0,
  );

  const total = validLines.reduce(
    (s, l) => s + Number(l.qty) * Number(l.unitPrice || 0),
    0,
  );

  const itemsPayload = JSON.stringify(
    validLines.map((l) => ({
      productId: Number(l.productId),
      qty: Number(l.qty),
      unitPrice: priceMode === "none" ? 0 : Number(l.unitPrice || 0),
    })),
  );

  return (
    <form action={action} className="space-y-5">
      {header}

      <input type="hidden" name="items" value={itemsPayload} />

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-2 text-right">المذكرة</th>
              <th className="p-2 text-right w-28">الكمية</th>
              {priceMode !== "none" && (
                <th className="p-2 text-right w-32">سعر الوحدة</th>
              )}
              {priceMode !== "none" && (
                <th className="p-2 text-right w-32">الإجمالي</th>
              )}
              <th className="p-2 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map((l) => {
              const selected = products.find((p) => p.id === l.productId);
              const lineTotal = Number(l.qty || 0) * Number(l.unitPrice || 0);
              return (
                <tr key={l.key}>
                  <td className="p-2">
                    <select
                      value={l.productId}
                      onChange={(e) => {
                        const pid = e.target.value ? Number(e.target.value) : "";
                        setLine(l.key, {
                          productId: pid,
                          unitPrice: pid ? defaultPrice(pid) : "",
                        });
                      }}
                      className="w-full min-w-44 rounded-lg border border-gray-300 px-2 py-1.5"
                    >
                      <option value="">— اختر المذكرة —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.availableQty !== undefined
                            ? ` (متاح: ${p.availableQty})`
                            : p.stock !== undefined
                              ? ` (مخزن: ${p.stock})`
                              : ""}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="1"
                      value={l.qty}
                      onChange={(e) => setLine(l.key, { qty: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-2 py-1.5"
                    />
                    {selected?.availableQty !== undefined &&
                      Number(l.qty) > selected.availableQty && (
                        <span className="text-xs text-red-600">
                          أكبر من المتاح
                        </span>
                      )}
                  </td>
                  {priceMode !== "none" && (
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={l.unitPrice}
                        onChange={(e) =>
                          setLine(l.key, { unitPrice: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5"
                      />
                    </td>
                  )}
                  {priceMode !== "none" && (
                    <td className="p-2 text-gray-700">
                      {formatMoney(lineTotal)}
                    </td>
                  )}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(l.key)}
                      className="text-red-500 hover:text-red-700"
                      aria-label="حذف"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={addLine}
          className="rounded-lg border border-indigo-300 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50"
        >
          + إضافة صنف
        </button>
        {showTotal && priceMode !== "none" && (
          <div className="text-lg font-bold text-gray-900">
            الإجمالي: {formatMoney(total)}
          </div>
        )}
      </div>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
