import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "المدير العام",
      username: "admin",
      passwordHash: adminPass,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { username: "store" },
    update: {},
    create: {
      name: "أمين المخزن",
      username: "store",
      passwordHash: await bcrypt.hash("store123", 10),
      role: "WAREHOUSE",
    },
  });

  await prisma.user.upsert({
    where: { username: "cashier" },
    update: {},
    create: {
      name: "كاشير المكتبة",
      username: "cashier",
      passwordHash: await bcrypt.hash("cashier123", 10),
      role: "CASHIER",
    },
  });

  const count = await prisma.product.count();
  if (count > 0) {
    console.log("Seed: بيانات موجودة بالفعل، تم إنشاء/تأكيد المستخدمين فقط.");
    return;
  }

  const supplier = await prisma.supplier.create({
    data: { name: "مطبعة النور", phone: "01000000000" },
  });

  const products = await Promise.all([
    prisma.product.create({
      data: { name: "مذكرة لغة عربية - الصف الثالث الثانوي", subject: "لغة عربية", grade: "ثالثة ثانوي", costPrice: 25, sellPrice: 50 },
    }),
    prisma.product.create({
      data: { name: "مذكرة فيزياء - الصف الثالث الثانوي", subject: "فيزياء", grade: "ثالثة ثانوي", costPrice: 30, sellPrice: 60 },
    }),
    prisma.product.create({
      data: { name: "مذكرة كيمياء - الصف الثاني الثانوي", subject: "كيمياء", grade: "ثانية ثانوي", costPrice: 22, sellPrice: 45 },
    }),
    prisma.product.create({
      data: { name: "مذكرة رياضيات - الصف الأول الثانوي", subject: "رياضيات", grade: "أولى ثانوي", costPrice: 20, sellPrice: 40 },
    }),
  ]);

  const teams = await Promise.all([
    prisma.team.create({ data: { name: "تيم القاهرة الكبرى", phone: "01111111111" } }),
    prisma.team.create({ data: { name: "تيم الصعيد", phone: "01222222222" } }),
  ]);

  await Promise.all([
    prisma.center.create({ data: { name: "سنتر التفوق", ownerName: "أحمد", governorate: "القاهرة", phone: "01000000001" } }),
    prisma.center.create({ data: { name: "سنتر النجاح", ownerName: "محمد", governorate: "الجيزة", phone: "01000000002" } }),
    prisma.center.create({ data: { name: "مكتبة الأمل", ownerName: "خالد", governorate: "أسيوط", phone: "01000000003" } }),
  ]);

  // استلام أولي من المطبعة لملء المخزن
  await prisma.printReceipt.create({
    data: {
      supplierId: supplier.id,
      createdById: admin.id,
      notes: "استلام افتتاحي",
      items: {
        create: products.map((p) => ({ productId: p.id, qty: 500, unitCost: p.costPrice })),
      },
    },
  });
  for (const p of products) {
    await prisma.product.update({ where: { id: p.id }, data: { stock: 500 } });
  }

  console.log("Seed تم بنجاح ✅");
  console.log("teams:", teams.map((t) => t.name).join(", "));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
