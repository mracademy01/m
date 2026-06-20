"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { parseItems } from "@/lib/items";

export async function createTransfer(formData: FormData) {
  const user = await requireRole("ADMIN", "WAREHOUSE");
  const teamId = Number(formData.get("teamId"));
  const type = String(formData.get("type") || "ISSUE");
  const items = parseItems(formData.get("items"));

  if (!teamId || items.length === 0 || (type !== "ISSUE" && type !== "RETURN")) {
    redirect("/transfers?error=invalid");
  }

  // التحقق من توفر الكميات
  for (const i of items) {
    if (type === "ISSUE") {
      const p = await prisma.product.findUnique({ where: { id: i.productId } });
      if (!p || p.stock < i.qty) {
        redirect("/transfers?error=stock");
      }
    } else {
      const ts = await prisma.teamStock.findUnique({
        where: { teamId_productId: { teamId, productId: i.productId } },
      });
      if (!ts || ts.qty < i.qty) {
        redirect("/transfers?error=custody");
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.teamTransfer.create({
      data: {
        teamId,
        type,
        notes: String(formData.get("notes") || "").trim() || null,
        createdById: user.id,
        items: { create: items.map((i) => ({ productId: i.productId, qty: i.qty })) },
      },
    });

    for (const i of items) {
      const dir = type === "ISSUE" ? 1 : -1;
      await tx.product.update({
        where: { id: i.productId },
        data: { stock: { increment: -dir * i.qty } },
      });
      await tx.teamStock.upsert({
        where: { teamId_productId: { teamId, productId: i.productId } },
        create: { teamId, productId: i.productId, qty: dir * i.qty },
        update: { qty: { increment: dir * i.qty } },
      });
    }
  });

  revalidatePath("/transfers");
  revalidatePath("/inventory");
  redirect(`/transfers?team=${teamId}&ok=1`);
}
