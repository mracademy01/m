import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import LineItemsForm, { type ProductOption } from "@/components/LineItemsForm";
import { createReceipt } from "./actions";

export default async function ReceiptsPage() {
  await requireRole("ADMIN", "WAREHOUSE");
  const [products, suppliers, receipts] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.printReceipt.findMany({
      orderBy: { date: "desc" },
      take: 20,
      include: { supplier: true, items: true },
    }),
  ]);

  const productOptions: ProductOption[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    costPrice: p.costPrice,
    sellPrice: p.sellPrice,
    stock: p.stock,
  }));

  return (
    <div>
      <PageHeader
        title="استلام من المطبعة"
        subtitle="تسجيل كميات داخلة للمخزن المركزي"
      />

      <Card className="mb-6">
        <LineItemsForm
          products={productOptions}
          action={createReceipt}
          priceMode="cost"
          submitLabel="حفظ الاستلام"
          header={
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  المطبعة
                </label>
                <select
                  name="supplierId"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">— بدون تحديد —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  ملاحظات
                </label>
                <input
                  name="notes"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="اختياري"
                />
              </div>
            </div>
          }
        />
      </Card>

      <h2 className="mb-3 text-lg font-bold text-gray-900">آخر عمليات الاستلام</h2>
      <div className="space-y-3">
        {receipts.map((r) => {
          const total = r.items.reduce((s, i) => s + i.qty * i.unitCost, 0);
          const units = r.items.reduce((s, i) => s + i.qty, 0);
          return (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">
                    {r.supplier?.name || "مطبعة غير محددة"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(r.date)}
                  </p>
                </div>
                <div className="text-sm text-gray-700">
                  {formatNumber(units)} نسخة · {formatMoney(total)}
                </div>
              </div>
              {r.notes && (
                <p className="mt-2 text-sm text-gray-500">{r.notes}</p>
              )}
            </Card>
          );
        })}
        {receipts.length === 0 && (
          <Card>
            <p className="text-center text-gray-500">لا توجد عمليات استلام بعد</p>
          </Card>
        )}
      </div>
    </div>
  );
}
