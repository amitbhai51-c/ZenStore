import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { orderId, digitalContent } = await req.json();

    if (!orderId || !digitalContent || digitalContent.trim().length === 0) {
      return NextResponse.json(
        { error: "Order ID and digital delivery key / instructions are required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "DELIVERED") {
      return NextResponse.json({ error: "Order has already been fulfilled." }, { status: 400 });
    }

    if (order.status === "DECLINED") {
      return NextResponse.json({ error: "Cannot fulfill a declined order." }, { status: 400 });
    }

    const cleanDelivery = digitalContent.trim();
    const now = new Date();

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "DELIVERED",
        digitalDelivery: cleanDelivery,
        deliveredAt: now,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        adminId: admin.user.id,
        action: "DELIVER_ORDER",
        targetType: "ORDER",
        targetId: order.id,
        details: JSON.stringify({
          orderNumber: order.orderNumber,
          userEmail: order.user.email,
        }),
      },
    });

    // Dispatch delivery email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendEmail({
      to: order.user.email,
      templateType: "ORDER_DELIVERED",
      variables: {
        username: order.user.username,
        orderNumber: order.orderNumber,
        totalCoins: order.totalCoins,
        digitalContent: cleanDelivery,
        orderDetailsUrl: `${appUrl}/account`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Order #${order.orderNumber} fulfilled! Delivery email dispatched to ${order.user.email}.`,
      order: updated,
    });
  } catch (error: any) {
    console.error("Order delivery error:", error);
    return NextResponse.json({ error: error?.message || "Failed to deliver order" }, { status: 500 });
  }
}
