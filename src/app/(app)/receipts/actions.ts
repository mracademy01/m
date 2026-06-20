"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { parseItems } from "@/lib/items";

export async function createReceipt(formData: FormData) {
  const user = await requireRole("ADMIN", "WAREHOUSE");
  const items = parseItems(formData.get("items"));
  if (items.length === 0) {
    redirect("/receipts?error=empty");
  }

  const supplierIdRaw = formData.get("supplierId");
  const supplierId = supplierIdRaw ? Number(supplierIdRaw) : null;
  const notes = String(formData.get("notes") || "").trim() || null;

  await prisma.$transaction(async (tx) => {
    await tx.printReceipt.create({
      data: {
        supplierId: supplierId || null,
        notes,
        createdById: user.id,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            unitCost: i.unitPrice,
          })),
        },
      },
    });
    for (const i of items) {
      await tx.product.update({
        where: { id: i.productId },
        data: { stock: { increment: i.qty } },
      });
    }
  });

  revalidatePath("/receipts");
  revalidatePath("/inventory");
  redirect("/receipts?ok=1");
}
