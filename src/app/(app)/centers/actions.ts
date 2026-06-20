"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function createCenter(formData: FormData) {
  await requireRole("ADMIN", "TEAM");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.center.create({
    data: {
      name,
      ownerName: String(formData.get("ownerName") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      governorate: String(formData.get("governorate") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
    },
  });
  revalidatePath("/centers");
}

export async function toggleCenter(formData: FormData) {
  await requireRole("ADMIN");
  const id = Number(formData.get("id"));
  const c = await prisma.center.findUnique({ where: { id } });
  if (!c) return;
  await prisma.center.update({ where: { id }, data: { active: !c.active } });
  revalidatePath("/centers");
}
