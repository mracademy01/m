import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, Badge } from "@/components/ui";
import { formatDateTime, formatNumber } from "@/lib/format";
import LineItemsForm, { type ProductOption } from "@/components/LineItemsForm";
import { createTransfer } from "./actions";

export default async function TransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  await requireRole("ADMIN", "WAREHOUSE", "TEAM");
  const sp = await searchParams;
  const selectedTeamId = sp.team ? Number(sp.team) : null;

  const [products, teams, custody, transfers] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.team.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    selectedTeamId
      ? prisma.teamStock.findMany({
          where: { teamId: selectedTeamId, qty: { gt: 0 } },
          include: { product: true },
          orderBy: { product: { name: "asc" } },
        })
      : Promise.resolve([]),
    prisma.teamTransfer.findMany({
      where: selectedTeamId ? { teamId: selectedTeamId } : {},
      orderBy: { date: "desc" },
      take: 15,
      include: { team: true, items: { include: { product: true } } },
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
        title="عُهدة التيمات"
        subtitle="تسليم بضاعة للتيم أو استرجاعها للمخزن"
      />

      <Card className="mb-6">
        <LineItemsForm
          products={productOptions}
          action={createTransfer}
          priceMode="none"
          submitLabel="تنفيذ الحركة"
          header={
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-gray-700">التيم</label>
                <select
                  name="teamId"
                  required
                  defaultValue={selectedTeamId ?? ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">— اختر التيم —</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  نوع الحركة
                </label>
                <select
                  name="type"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="ISSUE">تسليم للتيم (من المخزن)</option>
                  <option value="RETURN">استرجاع للمخزن (من التيم)</option>
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

      {selectedTeamId && (
        <Card className="mb-6">
          <h2 className="mb-3 font-bold text-gray-800">
            العُهدة الحالية للتيم المحدد
          </h2>
          {custody.length === 0 ? (
            <p className="text-sm text-gray-500">لا توجد عُهدة حالية</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {custody.map((c) => (
                <Badge key={c.id} color="blue">
                  {c.product.name}: {formatNumber(c.qty)}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      )}

      <h2 className="mb-3 text-lg font-bold text-gray-900">آخر الحركات</h2>
      <div className="space-y-3">
        {transfers.map((t) => (
          <Card key={t.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900">{t.team.name}</p>
                <p className="text-xs text-gray-500">{formatDateTime(t.date)}</p>
              </div>
              {t.type === "ISSUE" ? (
                <Badge color="green">تسليم للتيم</Badge>
              ) : (
                <Badge color="yellow">استرجاع للمخزن</Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
              {t.items.map((i) => (
                <span key={i.id} className="rounded bg-gray-100 px-2 py-0.5">
                  {i.product.name} × {formatNumber(i.qty)}
                </span>
              ))}
            </div>
          </Card>
        ))}
        {transfers.length === 0 && (
          <Card>
            <p className="text-center text-gray-500">لا توجد حركات بعد</p>
          </Card>
        )}
      </div>
    </div>
  );
}
