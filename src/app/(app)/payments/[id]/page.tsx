import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCenterBalance } from "@/lib/accounts";
import { Card, PageHeader, SubmitButton, Badge } from "@/components/ui";
import { formatMoney, formatDateTime } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/roles";
import { createPayment } from "../actions";

type Entry = {
  date: Date;
  kind: "delivery" | "return" | "payment";
  label: string;
  debit: number; // عليه
  credit: number; // له
};

export default async function CenterAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;
  const centerId = Number(id);
  const center = await prisma.center.findUnique({ where: { id: centerId } });
  if (!center) notFound();

  const [deliveries, returns, payments, balance] = await Promise.all([
    prisma.centerDelivery.findMany({
      where: { centerId },
      include: { items: true },
      orderBy: { date: "asc" },
    }),
    prisma.centerReturn.findMany({
      where: { centerId },
      include: { items: true },
      orderBy: { date: "asc" },
    }),
    prisma.payment.findMany({
      where: { centerId },
      orderBy: { date: "asc" },
    }),
    getCenterBalance(centerId),
  ]);

  const entries: Entry[] = [
    ...deliveries.map((d) => ({
      date: d.date,
      kind: "delivery" as const,
      label: "تسليم بضاعة",
      debit: d.items.reduce((s, i) => s + i.qty * i.unitPrice, 0),
      credit: 0,
    })),
    ...returns.map((r) => ({
      date: r.date,
      kind: "return" as const,
      label: "مرتجع",
      debit: 0,
      credit: r.items.reduce((s, i) => s + i.qty * i.unitPrice, 0),
    })),
    ...payments.map((p) => ({
      date: p.date,
      kind: "payment" as const,
      label: `تحصيل (${paymentMethodLabel(p.method)})${p.reference ? ` - ${p.reference}` : ""}`,
      debit: 0,
      credit: p.amount,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const rows = entries.map((e, i) => ({
    ...e,
    running: entries
      .slice(0, i + 1)
      .reduce((s, x) => s + x.debit - x.credit, 0),
  }));

  return (
    <div>
      <PageHeader
        title={`كشف حساب: ${center.name}`}
        subtitle={center.governorate || undefined}
        action={
          <Link
            href="/payments"
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
          >
            رجوع
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-xs text-gray-500">إجمالي التسليم</p>
          <p className="mt-1 text-lg font-bold">{formatMoney(balance.delivered)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">المرتجعات</p>
          <p className="mt-1 text-lg font-bold">{formatMoney(balance.returned)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">المحصّل</p>
          <p className="mt-1 text-lg font-bold">{formatMoney(balance.paid)}</p>
        </Card>
        <Card className="border-r-4 border-red-500">
          <p className="text-xs text-gray-500">المتبقي عليه</p>
          <p className="mt-1 text-lg font-bold text-red-600">
            {formatMoney(balance.balance)}
          </p>
        </Card>
      </div>

      <Card className="mb-6">
        <h2 className="mb-4 font-bold text-gray-800">تسجيل تحصيل جديد</h2>
        <form
          action={createPayment}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <input type="hidden" name="centerId" value={center.id} />
          <input
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="المبلغ *"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <select
            name="method"
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="CASH">كاش</option>
            <option value="TRANSFER">تحويل</option>
          </select>
          <input
            name="reference"
            placeholder="رقم عملية التحويل (إن وجد)"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <SubmitButton>تسجيل التحصيل</SubmitButton>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 font-bold text-gray-800">حركة الحساب</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-600">
              <tr className="border-b border-gray-200 text-right">
                <th className="p-2">التاريخ</th>
                <th className="p-2">البيان</th>
                <th className="p-2">عليه (مدين)</th>
                <th className="p-2">له (دائن)</th>
                <th className="p-2">الرصيد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((e, idx) => {
                return (
                  <tr key={idx} className="text-right">
                    <td className="p-2 text-gray-500">
                      {formatDateTime(e.date)}
                    </td>
                    <td className="p-2">
                      {e.kind === "delivery" && (
                        <Badge color="red">{e.label}</Badge>
                      )}
                      {e.kind === "return" && (
                        <Badge color="yellow">{e.label}</Badge>
                      )}
                      {e.kind === "payment" && (
                        <Badge color="green">{e.label}</Badge>
                      )}
                    </td>
                    <td className="p-2">
                      {e.debit ? formatMoney(e.debit) : "—"}
                    </td>
                    <td className="p-2">
                      {e.credit ? formatMoney(e.credit) : "—"}
                    </td>
                    <td className="p-2 font-medium">{formatMoney(e.running)}</td>
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    لا توجد حركات على هذا الحساب
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
