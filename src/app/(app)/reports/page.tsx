import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllCenterBalances } from "@/lib/accounts";
import { Card, PageHeader } from "@/components/ui";
import { formatMoney, formatNumber } from "@/lib/format";

export default async function ReportsPage() {
  await requireRole("ADMIN");

  const [
    deliveryItems,
    returnItems,
    paymentsAgg,
    shopAgg,
    shopItems,
    products,
    centers,
    balances,
  ] = await Promise.all([
    prisma.centerDeliveryItem.findMany({ select: { productId: true, qty: true, unitPrice: true } }),
    prisma.centerReturnItem.findMany({ select: { qty: true, unitPrice: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.shopSale.aggregate({ _sum: { total: true }, _count: true }),
    prisma.shopSaleItem.findMany({ select: { productId: true, qty: true } }),
    prisma.product.findMany(),
    prisma.center.findMany(),
    getAllCenterBalances(),
  ]);

  const productName = new Map(products.map((p) => [p.id, p.name]));

  const delivered = deliveryItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const returned = returnItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const collected = paymentsAgg._sum.amount ?? 0;
  const outstanding = [...balances.values()].reduce((s, b) => s + b.balance, 0);
  const shopTotal = shopAgg._sum.total ?? 0;

  // أكثر المذكرات مبيعاً (تسليم سناتر + مكتبة)
  const qtyByProduct = new Map<number, number>();
  for (const i of deliveryItems)
    qtyByProduct.set(i.productId, (qtyByProduct.get(i.productId) ?? 0) + i.qty);
  for (const i of shopItems)
    qtyByProduct.set(i.productId, (qtyByProduct.get(i.productId) ?? 0) + i.qty);
  const topProducts = [...qtyByProduct.entries()]
    .map(([id, qty]) => ({ name: productName.get(id) ?? `#${id}`, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // المديونيات حسب المحافظة
  const govMap = new Map<string, number>();
  for (const c of centers) {
    const bal = balances.get(c.id)?.balance ?? 0;
    if (bal <= 0) continue;
    const gov = c.governorate || "غير محدد";
    govMap.set(gov, (govMap.get(gov) ?? 0) + bal);
  }
  const byGov = [...govMap.entries()]
    .map(([gov, total]) => ({ gov, total }))
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      <PageHeader title="التقارير" subtitle="ملخص الأداء المالي والتشغيلي" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-r-4 border-indigo-500">
          <p className="text-sm text-gray-500">إجمالي التسليم للسناتر</p>
          <p className="mt-2 text-2xl font-bold">{formatMoney(delivered)}</p>
        </Card>
        <Card className="border-r-4 border-yellow-500">
          <p className="text-sm text-gray-500">إجمالي المرتجعات</p>
          <p className="mt-2 text-2xl font-bold">{formatMoney(returned)}</p>
        </Card>
        <Card className="border-r-4 border-green-500">
          <p className="text-sm text-gray-500">إجمالي المحصّل من السناتر</p>
          <p className="mt-2 text-2xl font-bold">{formatMoney(collected)}</p>
        </Card>
        <Card className="border-r-4 border-red-500">
          <p className="text-sm text-gray-500">المديونيات المتبقية</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatMoney(outstanding)}
          </p>
        </Card>
        <Card className="border-r-4 border-teal-500">
          <p className="text-sm text-gray-500">إجمالي مبيعات المكتبة</p>
          <p className="mt-2 text-2xl font-bold">{formatMoney(shopTotal)}</p>
        </Card>
        <Card className="border-r-4 border-blue-500">
          <p className="text-sm text-gray-500">عدد فواتير المكتبة</p>
          <p className="mt-2 text-2xl font-bold">
            {formatNumber(shopAgg._count)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-bold text-gray-800">
            أكثر المذكرات توزيعاً
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-500">لا توجد بيانات بعد</p>
          ) : (
            <ul className="space-y-2">
              {topProducts.map((p, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-800">
                    {i + 1}. {p.name}
                  </span>
                  <span className="font-medium text-gray-700">
                    {formatNumber(p.qty)} نسخة
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-bold text-gray-800">
            المديونيات حسب المحافظة
          </h2>
          {byGov.length === 0 ? (
            <p className="text-sm text-gray-500">لا توجد مديونيات</p>
          ) : (
            <ul className="space-y-2">
              {byGov.map((g, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-800">{g.gov}</span>
                  <span className="font-medium text-red-600">
                    {formatMoney(g.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
