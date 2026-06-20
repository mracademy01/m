export type Role = "ADMIN" | "WAREHOUSE" | "TEAM" | "CENTER" | "CASHIER";

export const ROLES: Role[] = ["ADMIN", "WAREHOUSE", "TEAM", "CENTER", "CASHIER"];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "مدير النظام",
  WAREHOUSE: "أمين المخزن",
  TEAM: "تيم (مندوب)",
  CENTER: "سنتر / مكتب",
  CASHIER: "كاشير المكتبة",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role as Role] ?? role;
}

export const PAYMENT_METHODS = ["CASH", "TRANSFER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "كاش",
  TRANSFER: "تحويل",
};

export function paymentMethodLabel(m: string): string {
  return PAYMENT_METHOD_LABELS[m as PaymentMethod] ?? m;
}
