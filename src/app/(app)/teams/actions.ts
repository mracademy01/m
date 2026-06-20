"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function createTeam(formData: FormData) {
  await requireRole("ADMIN", "WAREHOUSE");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.team.create({
    data: {
      name,
      phone: String(formData.get("phone") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
    },
  });
  revalidatePath("/teams");
}

export async function toggleTeam(formData: FormData) {
  await requireRole("ADMIN", "WAREHOUSE");
  const id = Number(formData.get("id"));
  const t = await prisma.team.findUnique({ where: { id } });
  if (!t) return;
  await prisma.team.update({ where: { id }, data: { active: !t.active } });
  revalidatePath("/teams");
}
