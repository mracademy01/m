import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, SubmitButton } from "@/components/ui";
import { updateProduct } from "../actions";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN", "WAREHOUSE");
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
  });
  if (!product) notFound();

  return (
    <div className="max-w-xl">
      <PageHeader title="تعديل المذكرة" subtitle={product.name} />
      <Card>
        <form action={updateProduct} className="space-y-4">
          <input type="hidden" name="id" value={product.id} />
          <div>
            <label className="mb-1 block text-sm text-gray-700">اسم المذكرة</label>
            <input
              name="name"
              required
              defaultValue={product.name}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-gray-700">المادة</label>
              <input
                name="subject"
                defaultValue={product.subject ?? ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">الصف</label>
              <input
                name="grade"
                defaultValue={product.grade ?? ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-gray-700">
                سعر التكلفة
              </label>
              <input
                name="costPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product.costPrice}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">سعر البيع</label>
              <input
                name="sellPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product.sellPrice}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <SubmitButton>حفظ التعديلات</SubmitButton>
            <Link
              href="/products"
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
            >
              إلغاء
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
