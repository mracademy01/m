import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-bl from-indigo-600 to-indigo-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-indigo-900">
            نظام توزيع المذكرات
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            تسجيل الدخول لإدارة المخزون والتوزيع والحسابات
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
