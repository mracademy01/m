import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, Badge } from "@/components/ui";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/roles";
import LineItemsForm, { type ProductOption } from "@/components/LineItemsForm";
import { createSale } from "./actions";

export default async function ShopPage() {
  await requireRole("ADMIN", "CASHIER");
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));

  const [products, sales, todayAgg] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.shopSale.findMany({
      orderBy: { date: "desc" },
      take: 15,
      include: { items: { include: { product: true } } },
    }),
    prisma.shopSale.aggregate({
      where: { date: { gte: startOfDay } },
      _sum: { total: true },
      _count: true,
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
      <PageHeader title="مبيعات المكتبة" subtitle="بيع مباشر للجمهور (نقطة بيع)" />

      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card className="border-r-4 border-teal-500">
          <p className="text-sm text-gray-500">مبيعات اليوم</p>
          <p className="mt-2 text-2xl font-bold text-teal-600">
            {formatMoney(todayAgg._sum.total ?? 0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">عدد الفواتير اليوم</p>
          <p className="mt-2 text-2xl font-bold">
            {formatNumber(todayAgg._count)}
          </p>
        </Card>
      </div>

      <Card className="mb-6">
        <LineItemsForm
          products={productOptions}
          action={createSale}
          priceMode="sell"
          submitLabel="إتمام البيع"
          header={
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  طريقة الدفع
                </label>
                <select
                  name="method"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="CASH">كاش</option>
                  <option value="TRANSFER">تحويل</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  رقم التحويل (إن وجد)
                </label>
                <input
                  name="reference"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
          }
        />
      </Card>

      <h2 className="mb-3 text-lg font-bold text-gray-900">آخر المبيعات</h2>
      <div className="space-y-3">
        {sales.map((s) => (
          <Card key={s.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-gray-500">{formatDateTime(s.date)}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-600">
                  {s.items.map((i) => (
                    <span key={i.id} className="rounded bg-gray-100 px-2 py-0.5">
                      {i.product.name} × {formatNumber(i.qty)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">{formatMoney(s.total)}</p>
                <Badge color="blue">{paymentMethodLabel(s.method)}</Badge>
              </div>
            </div>
          </Card>
        ))}
        {sales.length === 0 && (
          <Card>
            <p className="text-center text-gray-500">لا توجد مبيعات بعد</p>
          </Card>
        )}
      </div>
    </div>
  );
}
