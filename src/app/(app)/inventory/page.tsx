import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, Badge } from "@/components/ui";
import { formatMoney, formatNumber } from "@/lib/format";

export default async function InventoryPage() {
  await requireRole("ADMIN", "WAREHOUSE");
  const [products, custody] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.teamStock.groupBy({ by: ["productId"], _sum: { qty: true } }),
  ]);
  const custodyMap = new Map(custody.map((c) => [c.productId, c._sum.qty ?? 0]));

  const totalUnits = products.reduce((s, p) => s + p.stock, 0);
  const totalValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0);

  return (
    <div>
      <PageHeader title="المخزن المركزي" subtitle="أرصدة المذكرات الحالية" />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500">إجمالي النسخ بالمخزن</p>
          <p className="mt-2 text-2xl font-bold">{formatNumber(totalUnits)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">قيمة المخزون (تكلفة)</p>
          <p className="mt-2 text-2xl font-bold">{formatMoney(totalValue)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">عدد الأصناف</p>
          <p className="mt-2 text-2xl font-bold">
            {formatNumber(products.length)}
          </p>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-600">
              <tr className="border-b border-gray-200 text-right">
                <th className="p-2">المذكرة</th>
                <th className="p-2">المخزن المركزي</th>
                <th className="p-2">عُهدة التيمات</th>
                <th className="p-2">قيمة المخزن (تكلفة)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="text-right">
                  <td className="p-2 font-medium text-gray-900">{p.name}</td>
                  <td className="p-2">
                    {p.stock === 0 ? (
                      <Badge color="red">نفد</Badge>
                    ) : p.stock <= 10 ? (
                      <Badge color="yellow">{formatNumber(p.stock)}</Badge>
                    ) : (
                      formatNumber(p.stock)
                    )}
                  </td>
                  <td className="p-2 text-gray-600">
                    {formatNumber(custodyMap.get(p.id) ?? 0)}
                  </td>
                  <td className="p-2 text-gray-600">
                    {formatMoney(p.stock * p.costPrice)}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    لا توجد مذكرات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
