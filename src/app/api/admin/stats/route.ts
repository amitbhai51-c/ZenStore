import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const [
      totalUsers,
      verifiedUsers,
      suspendedUsers,
      totalProducts,
      availableProducts,
      pendingOrders,
      deliveredOrders,
      pendingPayments,
      walletAggregate,
      recentOrders,
      recentUsers,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.product.count({ where: { isArchived: false } }),
      prisma.product.count({ where: { isArchived: false, isAvailable: true, stockQuantity: { gt: 0 } } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.paymentRequest.count({ where: { status: "PENDING" } }),
      prisma.user.aggregate({ _sum: { coinBalance: true } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { user: { select: { email: true, username: true } } },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, email: true, username: true, role: true, isVerified: true, coinBalance: true, createdAt: true },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { user: { select: { username: true, email: true } } },
      }),
    ]);

    const totalCoinsInCirculation = walletAggregate._sum.coinBalance || 0;

    return NextResponse.json({
      stats: {
        totalUsers,
        verifiedUsers,
        suspendedUsers,
        totalProducts,
        availableProducts,
        outOfStockProducts: totalProducts - availableProducts,
        pendingOrders,
        deliveredOrders,
        pendingPayments,
        totalCoinsInCirculation,
      },
      recentOrders,
      recentUsers,
      recentAuditLogs,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load admin dashboard stats" }, { status: 500 });
  }
}
