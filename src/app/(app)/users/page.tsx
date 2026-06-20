import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, Badge } from "@/components/ui";
import { roleLabel } from "@/lib/roles";
import { formatDate } from "@/lib/format";
import UserForm from "./UserForm";
import { toggleUser } from "./actions";

export default async function UsersPage() {
  const me = await requireRole("ADMIN");
  const [users, teams, centers] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { team: true, center: true },
    }),
    prisma.team.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.center.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="المستخدمون" subtitle="إدارة حسابات الدخول والصلاحيات" />

      <Card className="mb-6">
        <h2 className="mb-4 font-bold text-gray-800">إضافة مستخدم</h2>
        <UserForm
          teams={teams.map((t) => ({ id: t.id, name: t.name }))}
          centers={centers.map((c) => ({ id: c.id, name: c.name }))}
        />
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-600">
              <tr className="border-b border-gray-200 text-right">
                <th className="p-2">الاسم</th>
                <th className="p-2">اسم المستخدم</th>
                <th className="p-2">الصلاحية</th>
                <th className="p-2">مرتبط بـ</th>
                <th className="p-2">تاريخ الإنشاء</th>
                <th className="p-2">الحالة</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="text-right">
                  <td className="p-2 font-medium text-gray-900">{u.name}</td>
                  <td className="p-2 text-gray-600">{u.username}</td>
                  <td className="p-2">
                    <Badge color="indigo">{roleLabel(u.role)}</Badge>
                  </td>
                  <td className="p-2 text-gray-600">
                    {u.team?.name || u.center?.name || "—"}
                  </td>
                  <td className="p-2 text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="p-2">
                    {u.active ? (
                      <Badge color="green">مفعّل</Badge>
                    ) : (
                      <Badge color="gray">موقوف</Badge>
                    )}
                  </td>
                  <td className="p-2">
                    {u.id !== me.id ? (
                      <form action={toggleUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="text-gray-500 hover:underline">
                          {u.active ? "إيقاف" : "تفعيل"}
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-gray-400">أنت</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
