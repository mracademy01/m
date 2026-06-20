"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/ui";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/roles";
import { createUser } from "./actions";

type Option = { id: number; name: string };

export default function UserForm({
  teams,
  centers,
}: {
  teams: Option[];
  centers: Option[];
}) {
  const [role, setRole] = useState<Role>("WAREHOUSE");

  return (
    <form
      action={createUser}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <input
        name="name"
        required
        placeholder="الاسم *"
        className="rounded-lg border border-gray-300 px-3 py-2"
      />
      <input
        name="username"
        required
        placeholder="اسم المستخدم *"
        className="rounded-lg border border-gray-300 px-3 py-2"
      />
      <input
        name="password"
        type="text"
        required
        placeholder="كلمة المرور *"
        className="rounded-lg border border-gray-300 px-3 py-2"
      />
      <select
        name="role"
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        className="rounded-lg border border-gray-300 px-3 py-2"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>

      {role === "TEAM" && (
        <select
          name="teamId"
          className="rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="">— ربط بتيم (اختياري) —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}

      {role === "CENTER" && (
        <select
          name="centerId"
          className="rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="">— ربط بسنتر (اختياري) —</option>
          {centers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      <SubmitButton>إضافة المستخدم</SubmitButton>
    </form>
  );
}
