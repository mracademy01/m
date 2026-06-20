import { prisma } from "@/lib/prisma";

export type CenterBalance = {
  delivered: number; // إجمالي ما تم تسليمه (بسعر البيع)
  returned: number; // إجمالي المرتجعات
  paid: number; // إجمالي المدفوع
  balance: number; // المتبقي على السنتر (مديونية)
};

export async function getCenterBalance(centerId: number): Promise<CenterBalance> {
  const deliveries = await prisma.centerDeliveryItem.findMany({
    where: { delivery: { centerId } },
    select: { qty: true, unitPrice: true },
  });
  const returns = await prisma.centerReturnItem.findMany({
    where: { ret: { centerId } },
    select: { qty: true, unitPrice: true },
  });
  const payments = await prisma.payment.aggregate({
    where: { centerId },
    _sum: { amount: true },
  });

  const delivered = deliveries.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const returned = returns.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const paid = payments._sum.amount ?? 0;

  return {
    delivered,
    returned,
    paid,
    balance: delivered - returned - paid,
  };
}

export async function getAllCenterBalances(): Promise<Map<number, CenterBalance>> {
  const [deliveries, returns, payments] = await Promise.all([
    prisma.centerDeliveryItem.findMany({
      select: { qty: true, unitPrice: true, delivery: { select: { centerId: true } } },
    }),
    prisma.centerReturnItem.findMany({
      select: { qty: true, unitPrice: true, ret: { select: { centerId: true } } },
    }),
    prisma.payment.groupBy({ by: ["centerId"], _sum: { amount: true } }),
  ]);

  const map = new Map<number, CenterBalance>();
  const ensure = (id: number) => {
    if (!map.has(id)) map.set(id, { delivered: 0, returned: 0, paid: 0, balance: 0 });
    return map.get(id)!;
  };

  for (const d of deliveries) {
    const b = ensure(d.delivery.centerId);
    b.delivered += d.qty * d.unitPrice;
  }
  for (const r of returns) {
    const b = ensure(r.ret.centerId);
    b.returned += r.qty * r.unitPrice;
  }
  for (const p of payments) {
    const b = ensure(p.centerId);
    b.paid += p._sum.amount ?? 0;
  }
  for (const b of map.values()) {
    b.balance = b.delivered - b.returned - b.paid;
  }
  return map;
}
