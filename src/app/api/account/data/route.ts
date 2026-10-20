import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const [user, orders, transactions, payments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: auth.user.id },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isVerified: true,
          isSuspended: true,
          suspensionReason: true,
          coinBalance: true,
          createdAt: true,
        },
      }),
      prisma.order.findMany({
        where: { userId: auth.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
        },
      }),
      prisma.coinTransaction.findMany({
        where: { userId: auth.user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.paymentRequest.findMany({
        where: { userId: auth.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      user,
      orders,
      transactions,
      payments,
    });
  } catch (error) {
    console.error("Account data fetch error:", error);
    return NextResponse.json({ error: "Failed to load account data" }, { status: 500 });
  }
}
