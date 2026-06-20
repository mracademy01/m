"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { parseItems } from "@/lib/items";

export async function createReturn(formData: FormData) {
  const user = await requireRole("ADMIN", "TEAM");
  const centerId = Number(formData.get("centerId"));
  const destRaw = String(formData.get("destination") || "WAREHOUSE");
  const teamId = destRaw === "WAREHOUSE" ? null : Number(destRaw);
  const items = parseItems(formData.get("items"));

  if (!centerId || items.length === 0) {
    redirect("/returns?error=invalid");
  }

  await prisma.$transaction(async (tx) => {
    await tx.centerReturn.create({
      data: {
        centerId,
        teamId,
        notes: String(formData.get("notes") || "").trim() || null,
        createdById: user.id,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            unitPrice: i.unitPrice,
          })),
        },
      },
    });
    for (const i of items) {
      if (teamId) {
        await tx.teamStock.upsert({
          where: { teamId_productId: { teamId, productId: i.productId } },
          create: { teamId, productId: i.productId, qty: i.qty },
          update: { qty: { increment: i.qty } },
        });
      } else {
        await tx.product.update({
          where: { id: i.productId },
          data: { stock: { increment: i.qty } },
        });
      }
    }
  });

  revalidatePath("/returns");
  revalidatePath("/inventory");
  revalidatePath(`/payments/${centerId}`);
  redirect("/returns?ok=1");
}
