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

    const { templateType, testRecipient } = await req.json();

    const recipient = testRecipient || admin.user.email;

    const sampleVariables: Record<string, string | number> = {
      username: admin.user.username,
      email: recipient,
      otp: "847291",
      expiresMinutes: 10,
      resetUrl: "http://localhost:3000/auth/reset-password?token=sample_token_123",
      loginUrl: "http://localhost:3000/auth/login",
      date: new Date().toLocaleString(),
      orderNumber: "ORD-20261020-DEMO",
      totalCoins: 1200,
      refundCoins: 1200,
      digitalContent: "MINECRAFT-XXXX-YYYY-ZZZZ-9999",
      orderDetailsUrl: "http://localhost:3000/account",
      declineReason: "Stock shortage for selected card denomination",
      suspensionReason: "Suspicious multiple IP attempt detected",
      supportEmail: "support@coincraft.local",
      coinsEarned: 500,
      amountInr: "50.00",
      referenceId: "PAY-DEMO-789",
      newBalance: 1500,
      status: "APPROVED",
      coins: 500,
      adminNote: "UTR verified successfully with bank ledger",
      reason: "Payment window timed out",
      purchaseUrl: "http://localhost:3000/purchase",
    };

    const result = await sendEmail({
      to: recipient,
      templateType,
      variables: sampleVariables,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: `Test email failed: ${result.error}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email of template "${templateType}" successfully dispatched to ${recipient}!`,
      simulated: result.simulated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to dispatch test email" }, { status: 500 });
  }
}
