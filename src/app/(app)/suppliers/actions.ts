"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function createSupplier(formData: FormData) {
  await requireRole("ADMIN", "WAREHOUSE");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.supplier.create({
    data: {
      name,
      phone: String(formData.get("phone") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
    },
  });
  revalidatePath("/suppliers");
}

export async function toggleSupplier(formData: FormData) {
  await requireRole("ADMIN", "WAREHOUSE");
  const id = Number(formData.get("id"));
  const s = await prisma.supplier.findUnique({ where: { id } });
  if (!s) return;
  await prisma.supplier.update({ where: { id }, data: { active: !s.active } });
  revalidatePath("/suppliers");
}
