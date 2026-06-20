import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, Badge, SubmitButton } from "@/components/ui";
import { formatMoney, formatNumber } from "@/lib/format";
import { createProduct, toggleProduct } from "./actions";

export default async function ProductsPage() {
  await requireRole("ADMIN", "WAREHOUSE", "CASHIER");
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="المذكرات"
        subtitle="إدارة المنتجات وأسعار التكلفة والبيع"
      />

      <Card className="mb-6">
        <h2 className="mb-4 font-bold text-gray-800">إضافة مذكرة جديدة</h2>
        <form
          action={createProduct}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <input
            name="name"
            required
            placeholder="اسم المذكرة *"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            name="subject"
            placeholder="المادة"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            name="grade"
            placeholder="الصف الدراسي"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            name="costPrice"
            type="number"
            step="0.01"
            min="0"
            placeholder="سعر التكلفة (من المطبعة)"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            name="sellPrice"
            type="number"
            step="0.01"
            min="0"
            placeholder="سعر البيع"
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
                <th className="p-2">المذكرة</th>
                <th className="p-2">المادة</th>
                <th className="p-2">الصف</th>
                <th className="p-2">التكلفة</th>
                <th className="p-2">البيع</th>
                <th className="p-2">المخزن</th>
                <th className="p-2">الحالة</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="text-right">
                  <td className="p-2 font-medium text-gray-900">{p.name}</td>
                  <td className="p-2 text-gray-600">{p.subject || "—"}</td>
                  <td className="p-2 text-gray-600">{p.grade || "—"}</td>
                  <td className="p-2">{formatMoney(p.costPrice)}</td>
                  <td className="p-2">{formatMoney(p.sellPrice)}</td>
                  <td className="p-2">{formatNumber(p.stock)}</td>
                  <td className="p-2">
                    {p.active ? (
                      <Badge color="green">مفعّل</Badge>
                    ) : (
                      <Badge color="gray">موقوف</Badge>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/products/${p.id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        تعديل
                      </Link>
                      <form action={toggleProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="text-gray-500 hover:underline"
                        >
                          {p.active ? "إيقاف" : "تفعيل"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500">
                    لا توجد مذكرات بعد
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
