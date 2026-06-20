import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllCenterBalances } from "@/lib/accounts";
import { Card, PageHeader, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/format";

export default async function PaymentsPage() {
  await requireRole("ADMIN");
  const [centers, balances] = await Promise.all([
    prisma.center.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    getAllCenterBalances(),
  ]);

  const rows = centers
    .map((c) => ({ center: c, bal: balances.get(c.id) }))
    .sort((a, b) => (b.bal?.balance ?? 0) - (a.bal?.balance ?? 0));

  const totalOutstanding = rows.reduce((s, r) => s + (r.bal?.balance ?? 0), 0);
  const totalPaid = rows.reduce((s, r) => s + (r.bal?.paid ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="التحصيل والحسابات"
        subtitle="مديونيات السناتر والمبالغ المحصّلة"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-r-4 border-red-500">
          <p className="text-sm text-gray-500">إجمالي المديونيات المتبقية</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatMoney(totalOutstanding)}
          </p>
        </Card>
        <Card className="border-r-4 border-green-500">
          <p className="text-sm text-gray-500">إجمالي المحصّل</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatMoney(totalPaid)}
          </p>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-600">
              <tr className="border-b border-gray-200 text-right">
                <th className="p-2">السنتر</th>
                <th className="p-2">المحافظة</th>
                <th className="p-2">إجمالي التسليم</th>
                <th className="p-2">المرتجعات</th>
                <th className="p-2">المحصّل</th>
                <th className="p-2">المتبقي</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(({ center, bal }) => (
                <tr key={center.id} className="text-right">
                  <td className="p-2 font-medium text-gray-900">
                    {center.name}
                  </td>
                  <td className="p-2 text-gray-600">
                    {center.governorate || "—"}
                  </td>
                  <td className="p-2">{formatMoney(bal?.delivered ?? 0)}</td>
                  <td className="p-2">{formatMoney(bal?.returned ?? 0)}</td>
                  <td className="p-2">{formatMoney(bal?.paid ?? 0)}</td>
                  <td className="p-2">
                    {(bal?.balance ?? 0) > 0 ? (
                      <Badge color="red">{formatMoney(bal?.balance ?? 0)}</Badge>
                    ) : (
                      <Badge color="green">مسدّد</Badge>
                    )}
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/payments/${center.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      كشف / تحصيل
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    لا توجد سناتر
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
