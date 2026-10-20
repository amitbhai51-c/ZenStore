import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
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
        { error: "Minimum coin purchase is 10 coins (₹1)" },
        { status: 400 }
      );
    }

    const rate = settings?.coinExchangeRateInr || 10;
    const amountInrPaise = Math.round((coinQty / rate) * 100);

    const refSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const paymentReference = `PAY-MAN-${dateStr}-${refSuffix}`;

    const request = await prisma.paymentRequest.create({
      data: {
        paymentReference,
        userId: auth.user.id,
        coinsAmount: coinQty,
        amountInrPaise,
        paymentMethod: "MANUAL_URL",
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      paymentReference,
      amountPaise: amountInrPaise,
      amountInr: (amountInrPaise / 100).toFixed(2),
      coins: coinQty,
      paymentUrl: settings?.manualPaymentUrl || "https://pay.example.com",
      instructions: settings?.manualPaymentInstructions || "Pay the exact amount and submit your 12-digit UTR.",
    });
  } catch (error: any) {
    console.error("Manual payment create error:", error);
    return NextResponse.json({ error: "Failed to initialize payment request" }, { status: 500 });
  }
}
