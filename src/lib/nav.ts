import type { Role } from "@/lib/roles";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles: Role[];
  group: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "لوحة التحكم", icon: "🏠", roles: ["ADMIN", "WAREHOUSE", "TEAM", "CENTER", "CASHIER"], group: "عام" },

  { href: "/products", label: "المذكرات", icon: "📚", roles: ["ADMIN", "WAREHOUSE", "CASHIER"], group: "المخزون" },
  { href: "/inventory", label: "المخزن المركزي", icon: "📦", roles: ["ADMIN", "WAREHOUSE"], group: "المخزون" },
  { href: "/suppliers", label: "المطابع", icon: "🏭", roles: ["ADMIN", "WAREHOUSE"], group: "المخزون" },
  { href: "/receipts", label: "استلام من المطبعة", icon: "📥", roles: ["ADMIN", "WAREHOUSE"], group: "المخزون" },

  { href: "/teams", label: "التيمات", icon: "🚚", roles: ["ADMIN", "WAREHOUSE"], group: "التوزيع" },
  { href: "/transfers", label: "عُهدة التيمات", icon: "🔄", roles: ["ADMIN", "WAREHOUSE", "TEAM"], group: "التوزيع" },
  { href: "/centers", label: "السناتر / المكاتب", icon: "🏢", roles: ["ADMIN", "TEAM"], group: "التوزيع" },
  { href: "/deliveries", label: "تسليم للسناتر", icon: "📤", roles: ["ADMIN", "TEAM"], group: "التوزيع" },
  { href: "/returns", label: "المرتجعات", icon: "↩️", roles: ["ADMIN", "TEAM"], group: "التوزيع" },

  { href: "/payments", label: "التحصيل والحسابات", icon: "💰", roles: ["ADMIN"], group: "الحسابات" },
  { href: "/shop", label: "مبيعات المكتبة", icon: "🛒", roles: ["ADMIN", "CASHIER"], group: "الحسابات" },
  { href: "/reports", label: "التقارير", icon: "📊", roles: ["ADMIN"], group: "الحسابات" },

  { href: "/users", label: "المستخدمون", icon: "👤", roles: ["ADMIN"], group: "الإدارة" },
];

export function navForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
