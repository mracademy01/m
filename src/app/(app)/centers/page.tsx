import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllCenterBalances } from "@/lib/accounts";
import { Card, PageHeader, Badge, SubmitButton } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { createCenter, toggleCenter } from "./actions";

export default async function CentersPage() {
  await requireRole("ADMIN", "TEAM");
  const [centers, balances] = await Promise.all([
    prisma.center.findMany({ orderBy: { createdAt: "desc" } }),
    getAllCenterBalances(),
  ]);

  return (
    <div>
      <PageHeader
        title="السناتر / المكاتب"
        subtitle="العملاء على مستوى الجمهورية (بيع بالأجل)"
      />

      <Card className="mb-6">
        <h2 className="mb-4 font-bold text-gray-800">إضافة سنتر / مكتب</h2>
        <form
          action={createCenter}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <input
            name="name"
            required
            placeholder="اسم السنتر / المكتب *"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            name="ownerName"
            placeholder="اسم المسؤول"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            name="phone"
            placeholder="رقم الهاتف"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            name="governorate"
            placeholder="المحافظة"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            name="address"
            placeholder="العنوان"
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
                <th className="p-2">السنتر / المكتب</th>
                <th className="p-2">المسؤول</th>
                <th className="p-2">المحافظة</th>
                <th className="p-2">الهاتف</th>
                <th className="p-2">المديونية</th>
                <th className="p-2">الحالة</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {centers.map((c) => {
                const bal = balances.get(c.id)?.balance ?? 0;
                return (
                  <tr key={c.id} className="text-right">
                    <td className="p-2 font-medium text-gray-900">{c.name}</td>
                    <td className="p-2 text-gray-600">{c.ownerName || "—"}</td>
                    <td className="p-2 text-gray-600">{c.governorate || "—"}</td>
                    <td className="p-2 text-gray-600">{c.phone || "—"}</td>
                    <td className="p-2">
                      <span
                        className={
                          bal > 0
                            ? "font-semibold text-red-600"
                            : "text-gray-600"
                        }
                      >
                        {formatMoney(bal)}
                      </span>
                    </td>
                    <td className="p-2">
                      {c.active ? (
                        <Badge color="green">مفعّل</Badge>
                      ) : (
                        <Badge color="gray">موقوف</Badge>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-3">
                        <Link
                          href={`/payments/${c.id}`}
                          className="text-indigo-600 hover:underline"
                        >
                          كشف الحساب
                        </Link>
                        <form action={toggleCenter}>
                          <input type="hidden" name="id" value={c.id} />
                          <button className="text-gray-500 hover:underline">
                            {c.active ? "إيقاف" : "تفعيل"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {centers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    لا توجد سناتر بعد
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
