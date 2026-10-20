import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { processOrderRefund } from "@/lib/wallet";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { orderId, reason } = await req.json();

    if (!orderId || !reason || reason.trim().length < 3) {
      return NextResponse.json(
        { error: "Order ID and a mandatory decline reason (min 3 chars) are required." },
        { status: 400 }
      );
    }

    const cleanReason = reason.trim();

    // Process refund and decline atomically
    const { order, refund } = await processOrderRefund(orderId, admin.user.id, cleanReason);

    // Send order decline & refund email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const user = await prisma.user.findUnique({
      where: { id: order.userId },
    });

    if (user) {
      await sendEmail({
        to: user.email,
        templateType: "ORDER_DECLINED",
        variables: {
          username: user.username,
          orderNumber: order.orderNumber,
          refundCoins: order.totalCoins,
          declineReason: cleanReason,
          accountUrl: `${appUrl}/account`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Order #${order.orderNumber} declined. ${order.totalCoins} coins refunded to ${user?.email}.`,
      order,
    });
  } catch (error: any) {
    console.error("Order decline error:", error);
    return NextResponse.json({ error: error?.message || "Failed to decline order" }, { status: 400 });
  }
}
