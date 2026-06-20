"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function createPayment(formData: FormData) {
  const user = await requireRole("ADMIN");
  const centerId = Number(formData.get("centerId"));
  const amount = Number(formData.get("amount"));
  const method = String(formData.get("method") || "CASH");

  if (!centerId || !Number.isFinite(amount) || amount <= 0) {
    redirect(`/payments/${centerId || ""}?error=amount`);
  }

  await prisma.payment.create({
    data: {
      centerId,
      amount,
      method: method === "TRANSFER" ? "TRANSFER" : "CASH",
      reference: String(formData.get("reference") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
      createdById: user.id,
    },
  });

  revalidatePath(`/payments/${centerId}`);
  revalidatePath("/payments");
  redirect(`/payments/${centerId}?ok=1`);
}
