import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, Badge, SubmitButton } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { createTeam, toggleTeam } from "./actions";

export default async function TeamsPage() {
  await requireRole("ADMIN", "WAREHOUSE");
  const [teams, custody] = await Promise.all([
    prisma.team.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.teamStock.groupBy({ by: ["teamId"], _sum: { qty: true } }),
  ]);
  const custodyMap = new Map(custody.map((c) => [c.teamId, c._sum.qty ?? 0]));

  return (
    <div>
      <PageHeader
        title="التيمات"
        subtitle="مندوبو التوزيع (عُهدة بضاعة بدون حسابات مالية)"
      />

      <Card className="mb-6">
        <h2 className="mb-4 font-bold text-gray-800">إضافة تيم</h2>
        <form
          action={createTeam}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <input
            name="name"
            required
            placeholder="اسم التيم *"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            name="phone"
            placeholder="رقم الهاتف"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            name="notes"
            placeholder="ملاحظات"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <SubmitButton>إضافة</SubmitButton>
        </form>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-600">
              <tr className="border-b border-gray-200 text-right">
                <th className="p-2">التيم</th>
                <th className="p-2">الهاتف</th>
                <th className="p-2">العُهدة الحالية</th>
                <th className="p-2">الحالة</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teams.map((t) => (
                <tr key={t.id} className="text-right">
                  <td className="p-2 font-medium text-gray-900">{t.name}</td>
                  <td className="p-2 text-gray-600">{t.phone || "—"}</td>
                  <td className="p-2">
                    {formatNumber(custodyMap.get(t.id) ?? 0)} نسخة
                  </td>
                  <td className="p-2">
                    {t.active ? (
                      <Badge color="green">مفعّل</Badge>
                    ) : (
                      <Badge color="gray">موقوف</Badge>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-3">
                      <Link
                        href={`/transfers?team=${t.id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        العُهدة
                      </Link>
                      <form action={toggleTeam}>
                        <input type="hidden" name="id" value={t.id} />
                        <button className="text-gray-500 hover:underline">
                          {t.active ? "إيقاف" : "تفعيل"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    لا توجد تيمات بعد
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
