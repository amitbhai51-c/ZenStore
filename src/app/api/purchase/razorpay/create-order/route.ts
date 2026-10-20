import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const settings = await prisma.websiteSettings.findUnique({
      where: { id: "default" },
    });

    if (settings?.globalMaintenance || settings?.purchaseMaintenance) {
      return NextResponse.json(
        { error: "Coin purchasing is currently undergoing maintenance." },
        { status: 503 }
      );
    }

    const { coins } = await req.json();
    const coinQty = parseInt(coins, 10);

    if (!coinQty || isNaN(coinQty) || coinQty < 10) {
      return NextResponse.json(
        { error: "Minimum purchase is 10 coins (₹1)" },
        { status: 400 }
      );
    }

    const rate = settings?.coinExchangeRateInr || 10;
    // Calculate amount in integer paise (e.g. 10 coins / 10 = ₹1 = 100 paise)
    const amountInrPaise = Math.round((coinQty / rate) * 100);

    const refSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const paymentReference = `PAY-RZP-${dateStr}-${refSuffix}`;

    // Create Razorpay Order
    const razorpayOrder = await createRazorpayOrder({
      amountPaise: amountInrPaise,
      receipt: paymentReference,
      notes: {
        userId: auth.user.id,
        coinsAmount: String(coinQty),
      },
    });

    // Save pending payment request in DB
    const record = await prisma.paymentRequest.create({
      data: {
        paymentReference,
        userId: auth.user.id,
        coinsAmount: coinQty,
        amountInrPaise,
        paymentMethod: "RAZORPAY",
        status: "PENDING",
        razorpayOrderId: razorpayOrder.orderId,
      },
    });

    return NextResponse.json({
      success: true,
      paymentReference,
      razorpayOrderId: razorpayOrder.orderId,
      amountPaise: amountInrPaise,
      amountInr: (amountInrPaise / 100).toFixed(2),
      coins: coinQty,
      currency: "INR",
      isSimulated: razorpayOrder.isSimulated,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
