import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllCenterBalances } from "@/lib/accounts";
import { Card } from "@/components/ui";
import { formatMoney, formatNumber } from "@/lib/format";

function StatCard({
  label,
  value,
  href,
  color,
}: {
  label: string;
  value: string;
  href?: string;
  color: string;
}) {
  const inner = (
    <Card className={`border-r-4 ${color} transition hover:shadow-md`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function DashboardPage() {
  const user = await requireUser();

  const [products, centersCount, teamsCount, balances, todaySales, lowStock] =
    await Promise.all([
      prisma.product.findMany({ where: { active: true } }),
      prisma.center.count({ where: { active: true } }),
      prisma.team.count({ where: { active: true } }),
      getAllCenterBalances(),
      prisma.shopSale.aggregate({
        where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        _sum: { total: true },
      }),
      prisma.product.findMany({
        where: { active: true, stock: { lte: 10 } },
        orderBy: { stock: "asc" },
        take: 5,
      }),
    ]);

  const stockUnits = products.reduce((s, p) => s + p.stock, 0);
  const stockValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0);
  const totalOutstanding = [...balances.values()].reduce(
    (s, b) => s + b.balance,
    0,
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          أهلاً، {user.name} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          نظرة عامة على المخزون والتوزيع والحسابات
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="عدد المذكرات"
          value={formatNumber(products.length)}
          href="/products"
          color="border-indigo-500"
        />
        <StatCard
          label="رصيد المخزن (نسخة)"
          value={formatNumber(stockUnits)}
          href="/inventory"
          color="border-blue-500"
        />
        <StatCard
          label="قيمة المخزون (تكلفة)"
          value={formatMoney(stockValue)}
          color="border-green-500"
        />
        <StatCard
          label="مديونيات السناتر"
          value={formatMoney(totalOutstanding)}
          href="/payments"
          color="border-red-500"
        />
        <StatCard
          label="عدد السناتر"
          value={formatNumber(centersCount)}
          href="/centers"
          color="border-yellow-500"
        />
        <StatCard
          label="عدد التيمات"
          value={formatNumber(teamsCount)}
          href="/teams"
          color="border-purple-500"
        />
        <StatCard
          label="مبيعات المكتبة اليوم"
          value={formatMoney(todaySales._sum.total ?? 0)}
          href="/shop"
          color="border-teal-500"
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-gray-900">
          مذكرات قاربت على النفاد
        </h2>
        <Card>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">لا يوجد نقص في المخزون 👌</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {lowStock.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="font-medium text-gray-800">{p.name}</span>
                  <span
                    className={
                      p.stock === 0 ? "text-red-600" : "text-yellow-700"
                    }
                  >
                    {formatNumber(p.stock)} نسخة
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
