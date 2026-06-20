"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";
import { ROLES, type Role } from "@/lib/roles";

export async function createUser(formData: FormData) {
  await requireRole("ADMIN");
  const name = String(formData.get("name") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "") as Role;

  if (!name || !username || !password || !ROLES.includes(role)) {
    redirect("/users?error=invalid");
  }

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) {
    redirect("/users?error=username");
  }

  const teamId = role === "TEAM" && formData.get("teamId")
    ? Number(formData.get("teamId"))
    : null;
  const centerId = role === "CENTER" && formData.get("centerId")
    ? Number(formData.get("centerId"))
    : null;

  await prisma.user.create({
    data: {
      name,
      username,
      role,
      teamId,
      centerId,
      passwordHash: await hashPassword(password),
    },
  });
  revalidatePath("/users");
  redirect("/users?ok=1");
}

export async function toggleUser(formData: FormData) {
  const me = await requireRole("ADMIN");
  const id = Number(formData.get("id"));
  if (id === me.id) return; // لا توقف نفسك
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return;
  await prisma.user.update({ where: { id }, data: { active: !u.active } });
  revalidatePath("/users");
}

export async function resetPassword(formData: FormData) {
  await requireRole("ADMIN");
  const id = Number(formData.get("id"));
  const password = String(formData.get("password") || "");
  if (!id || password.length < 4) redirect("/users?error=password");
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(password) },
  });
  revalidatePath("/users");
  redirect("/users?ok=pw");
}
