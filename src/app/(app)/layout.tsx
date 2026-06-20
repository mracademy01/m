import { requireUser } from "@/lib/auth";
import { navForRole } from "@/lib/nav";
import { roleLabel } from "@/lib/roles";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const items = navForRole(user.role);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={items}
        userName={user.name}
        roleLabel={roleLabel(user.role)}
      />
      <main className="flex-1 overflow-x-hidden p-4 lg:p-8">{children}</main>
    </div>
  );
}
