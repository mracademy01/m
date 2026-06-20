import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import LineItemsForm, { type ProductOption } from "@/components/LineItemsForm";
import { createReturn } from "./actions";

export default async function ReturnsPage() {
  await requireRole("ADMIN", "TEAM");
  const [products, centers, teams, returns] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.center.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.team.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.centerReturn.findMany({
      orderBy: { date: "desc" },
      take: 15,
      include: {
        center: true,
        team: true,
        items: { include: { product: true } },
      },
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
        title="المرتجعات"
        subtitle="استرجاع بضاعة من السنتر — تُخصم من مديونيته"
      />

      <Card className="mb-6">
        <LineItemsForm
          products={productOptions}
          action={createReturn}
          priceMode="sell"
          submitLabel="حفظ المرتجع"
          header={
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-gray-700">السنتر</label>
                <select
                  name="centerId"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">— اختر السنتر —</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.governorate ? ` - ${c.governorate}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  وجهة الإرجاع
                </label>
                <select
                  name="destination"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="WAREHOUSE">المخزن المركزي</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      عُهدة تيم: {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">ملاحظات</label>
                <input
                  name="notes"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
          }
        />
      </Card>

      <h2 className="mb-3 text-lg font-bold text-gray-900">آخر المرتجعات</h2>
      <div className="space-y-3">
        {returns.map((r) => {
          const total = r.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
          return (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{r.center.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(r.date)} ·{" "}
                    {r.team ? `إلى عُهدة ${r.team.name}` : "إلى المخزن المركزي"}
                  </p>
                </div>
                <div className="font-semibold text-green-600">
                  - {formatMoney(total)}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                {r.items.map((i) => (
                  <span key={i.id} className="rounded bg-gray-100 px-2 py-0.5">
                    {i.product.name} × {formatNumber(i.qty)}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
        {returns.length === 0 && (
          <Card>
            <p className="text-center text-gray-500">لا توجد مرتجعات بعد</p>
          </Card>
        )}
      </div>
    </div>
  );
}
