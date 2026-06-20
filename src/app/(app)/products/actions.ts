"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function createProduct(formData: FormData) {
  await requireRole("ADMIN", "WAREHOUSE");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.product.create({
    data: {
      name,
      subject: String(formData.get("subject") || "").trim() || null,
      grade: String(formData.get("grade") || "").trim() || null,
      costPrice: Number(formData.get("costPrice") || 0),
      sellPrice: Number(formData.get("sellPrice") || 0),
    },
  });
  revalidatePath("/products");
}

export async function updateProduct(formData: FormData) {
  await requireRole("ADMIN", "WAREHOUSE");
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  if (!id || !name) return;
  await prisma.product.update({
    where: { id },
    data: {
      name,
      subject: String(formData.get("subject") || "").trim() || null,
      grade: String(formData.get("grade") || "").trim() || null,
      costPrice: Number(formData.get("costPrice") || 0),
      sellPrice: Number(formData.get("sellPrice") || 0),
    },
  });
  revalidatePath("/products");
  redirect("/products");
}

export async function toggleProduct(formData: FormData) {
  await requireRole("ADMIN", "WAREHOUSE");
  const id = Number(formData.get("id"));
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return;
  await prisma.product.update({
    where: { id },
    data: { active: !product.active },
  });
  revalidatePath("/products");
}
