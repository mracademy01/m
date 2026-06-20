import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import LineItemsForm, { type ProductOption } from "@/components/LineItemsForm";
import { createDelivery } from "./actions";

export default async function DeliveriesPage() {
  await requireRole("ADMIN", "TEAM");
  const [products, centers, teams, deliveries] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.center.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.team.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.centerDelivery.findMany({
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
        title="تسليم للسناتر"
        subtitle="بيع بالأجل — يُضاف على مديونية السنتر بسعر البيع"
      />

      <Card className="mb-6">
        <LineItemsForm
          products={productOptions}
          action={createDelivery}
          priceMode="sell"
          submitLabel="حفظ التسليم"
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
                  مصدر البضاعة
                </label>
                <select
                  name="source"
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

      <h2 className="mb-3 text-lg font-bold text-gray-900">آخر عمليات التسليم</h2>
      <div className="space-y-3">
        {deliveries.map((d) => {
          const total = d.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
          return (
            <Card key={d.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{d.center.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(d.date)} ·{" "}
                    {d.team ? `من عُهدة ${d.team.name}` : "من المخزن المركزي"}
                  </p>
                </div>
                <div className="font-semibold text-red-600">
                  {formatMoney(total)}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                {d.items.map((i) => (
                  <span key={i.id} className="rounded bg-gray-100 px-2 py-0.5">
                    {i.product.name} × {formatNumber(i.qty)}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
        {deliveries.length === 0 && (
          <Card>
            <p className="text-center text-gray-500">لا توجد عمليات تسليم بعد</p>
          </Card>
        )}
      </div>
    </div>
  );
}
