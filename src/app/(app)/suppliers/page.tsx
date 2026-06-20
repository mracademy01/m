import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, Badge, SubmitButton } from "@/components/ui";
import { createSupplier, toggleSupplier } from "./actions";

export default async function SuppliersPage() {
  await requireRole("ADMIN", "WAREHOUSE");
  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="المطابع" subtitle="موردو المذكرات" />

      <Card className="mb-6">
        <h2 className="mb-4 font-bold text-gray-800">إضافة مطبعة</h2>
        <form
          action={createSupplier}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <input
            name="name"
            required
            placeholder="اسم المطبعة *"
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
                <th className="p-2">المطبعة</th>
                <th className="p-2">الهاتف</th>
                <th className="p-2">ملاحظات</th>
                <th className="p-2">الحالة</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map((s) => (
                <tr key={s.id} className="text-right">
                  <td className="p-2 font-medium text-gray-900">{s.name}</td>
                  <td className="p-2 text-gray-600">{s.phone || "—"}</td>
                  <td className="p-2 text-gray-600">{s.notes || "—"}</td>
                  <td className="p-2">
                    {s.active ? (
                      <Badge color="green">مفعّل</Badge>
                    ) : (
                      <Badge color="gray">موقوف</Badge>
                    )}
                  </td>
                  <td className="p-2">
                    <form action={toggleSupplier}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="text-gray-500 hover:underline">
                        {s.active ? "إيقاف" : "تفعيل"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    لا توجد مطابع بعد
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
