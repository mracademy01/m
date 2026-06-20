"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { parseItems } from "@/lib/items";

export async function createSale(formData: FormData) {
  const user = await requireRole("ADMIN", "CASHIER");
  const items = parseItems(formData.get("items"));
  const method = String(formData.get("method") || "CASH");

  if (items.length === 0) {
    redirect("/shop?error=empty");
  }

  for (const i of items) {
    const p = await prisma.product.findUnique({ where: { id: i.productId } });
    if (!p || p.stock < i.qty) redirect("/shop?error=stock");
  }

  const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

  await prisma.$transaction(async (tx) => {
    await tx.shopSale.create({
      data: {
        method: method === "TRANSFER" ? "TRANSFER" : "CASH",
        reference: String(formData.get("reference") || "").trim() || null,
        notes: String(formData.get("notes") || "").trim() || null,
        total,
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
      await tx.product.update({
        where: { id: i.productId },
        data: { stock: { decrement: i.qty } },
      });
    }
  });

  revalidatePath("/shop");
  revalidatePath("/inventory");
  redirect("/shop?ok=1");
}
