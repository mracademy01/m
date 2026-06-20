"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { parseItems } from "@/lib/items";

export async function createDelivery(formData: FormData) {
  const user = await requireRole("ADMIN", "TEAM");
  const centerId = Number(formData.get("centerId"));
  const sourceRaw = String(formData.get("source") || "WAREHOUSE");
  const teamId = sourceRaw === "WAREHOUSE" ? null : Number(sourceRaw);
  const items = parseItems(formData.get("items"));

  if (!centerId || items.length === 0) {
    redirect("/deliveries?error=invalid");
  }

  // التحقق من توفر الكميات في المصدر
  for (const i of items) {
    if (teamId) {
      const ts = await prisma.teamStock.findUnique({
        where: { teamId_productId: { teamId, productId: i.productId } },
      });
      if (!ts || ts.qty < i.qty) redirect("/deliveries?error=stock");
    } else {
      const p = await prisma.product.findUnique({ where: { id: i.productId } });
      if (!p || p.stock < i.qty) redirect("/deliveries?error=stock");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.centerDelivery.create({
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
        await tx.teamStock.update({
          where: { teamId_productId: { teamId, productId: i.productId } },
          data: { qty: { decrement: i.qty } },
        });
      } else {
        await tx.product.update({
          where: { id: i.productId },
          data: { stock: { decrement: i.qty } },
        });
      }
    }
  });

  revalidatePath("/deliveries");
  revalidatePath("/inventory");
  revalidatePath(`/payments/${centerId}`);
  redirect("/deliveries?ok=1");
}
