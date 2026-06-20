"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { NavItem } from "@/lib/nav";

export default function Sidebar({
  items,
  userName,
  roleLabel,
}: {
  items: NavItem[];
  userName: string;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const groups = items.reduce<Record<string, NavItem[]>>((acc, item) => {
    (acc[item.group] ||= []).push(item);
    return acc;
  }, {});

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed top-3 right-3 z-30 rounded-lg bg-indigo-600 px-3 py-2 text-white shadow lg:hidden"
        aria-label="القائمة"
      >
        ☰
      </button>

      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-20 flex w-64 flex-col bg-indigo-950 text-indigo-100 transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="border-b border-indigo-800 p-5">
          <h2 className="text-lg font-bold text-white">توزيع المذكرات</h2>
          <p className="mt-2 text-sm text-indigo-300">{userName}</p>
          <p className="text-xs text-indigo-400">{roleLabel}</p>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {Object.entries(groups).map(([group, groupItems]) => (
            <div key={group}>
              <p className="mb-1 px-2 text-xs font-semibold text-indigo-400">
                {group}
              </p>
              <ul className="space-y-1">
                {groupItems.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                          active
                            ? "bg-indigo-600 text-white"
                            : "text-indigo-200 hover:bg-indigo-900"
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <form action="/api/logout" method="post" className="border-t border-indigo-800 p-3">
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-800 px-3 py-2 text-sm text-white hover:bg-indigo-700"
          >
            تسجيل الخروج
          </button>
        </form>
      </aside>
    </>
  );
}
