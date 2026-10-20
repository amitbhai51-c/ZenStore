import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { creditCoins } from "@/lib/wallet";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { paymentId, action, note } = await req.json();

    if (!paymentId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid payment review parameters" }, { status: 400 });
    }

    const payment = await prisma.paymentRequest.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    }

    if (payment.status === "SUCCESS") {
      return NextResponse.json({ error: "Payment has already been approved." }, { status: 400 });
    }

    const cleanNote = note?.trim() || "";

    if (action === "approve") {
      const result = await prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.paymentRequest.update({
          where: { id: payment.id },
          data: {
            status: "SUCCESS",
            adminNote: cleanNote || "Approved by administrator",
            reviewedBy: admin.user.username,
            reviewedAt: new Date(),
          },
        });

        const creditResult = await creditCoins({
          userId: payment.userId,
          amount: payment.coinsAmount,
          type: "COIN_PURCHASE",
          referenceId: payment.paymentReference,
          description: `Approved manual coin purchase (${payment.coinsAmount} coins, UTR: ${
            payment.utrReference || "N/A"
          })`,
          tx,
        });

        await tx.auditLog.create({
          data: {
            adminId: admin.user.id,
            action: "APPROVE_PAYMENT",
            targetType: "PAYMENT",
            targetId: payment.id,
            details: JSON.stringify({
              paymentReference: payment.paymentReference,
              coinsAmount: payment.coinsAmount,
              utrReference: payment.utrReference,
            }),
          },
        });

        return { updatedPayment, creditResult };
      });

      // Send approval notification email
      await sendEmail({
        to: payment.user.email,
        templateType: "MANUAL_PAYMENT_STATUS",
        variables: {
          username: payment.user.username,
          referenceId: payment.paymentReference,
          status: "APPROVED",
          coins: payment.coinsAmount,
          adminNote: cleanNote || "Your payment reference was verified and coins have been added.",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Payment approved! +${payment.coinsAmount} coins credited to ${payment.user.email}.`,
      });
    } else {
      // Reject
      if (!cleanNote || cleanNote.length < 3) {
        return NextResponse.json(
          { error: "A mandatory rejection reason is required." },
          { status: 400 }
        );
      }

      await prisma.paymentRequest.update({
        where: { id: payment.id },
        data: {
          status: "REJECTED",
          adminNote: cleanNote,
          reviewedBy: admin.user.username,
          reviewedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          adminId: admin.user.id,
          action: "REJECT_PAYMENT",
          targetType: "PAYMENT",
          targetId: payment.id,
          details: JSON.stringify({
            paymentReference: payment.paymentReference,
            reason: cleanNote,
          }),
        },
      });

      // Send rejection notification email
      await sendEmail({
        to: payment.user.email,
        templateType: "MANUAL_PAYMENT_STATUS",
        variables: {
          username: payment.user.username,
          referenceId: payment.paymentReference,
          status: "REJECTED",
          coins: payment.coinsAmount,
          adminNote: cleanNote,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Payment request marked as REJECTED with note.`,
      });
    }
  } catch (error: any) {
    console.error("Payment review error:", error);
    return NextResponse.json({ error: error?.message || "Failed to review payment" }, { status: 500 });
  }
}
