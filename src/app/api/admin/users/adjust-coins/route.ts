import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { creditCoins, debitCoins } from "@/lib/wallet";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { userId, amount, reason } = await req.json();

    if (!userId || !amount || !reason || reason.trim().length < 3) {
      return NextResponse.json(
        { error: "Target User ID, non-zero coin amount, and mandatory reason (min 3 chars) are required." },
        { status: 400 }
      );
    }

    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount === 0) {
      return NextResponse.json({ error: "Amount must be a non-zero integer" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const cleanReason = reason.trim();

    // Perform adjustment inside transaction
    const result = await prisma.$transaction(async (tx) => {
      let walletOp;
      if (numAmount > 0) {
        walletOp = await creditCoins({
          userId: targetUser.id,
          amount: numAmount,
          type: "ADMIN_ADJUSTMENT",
          referenceId: `ADM-ADJ-${Date.now()}`,
          description: `Admin manual credit by ${admin.user.username}: ${cleanReason}`,
          tx,
        });
      } else {
        walletOp = await debitCoins({
          userId: targetUser.id,
          amount: Math.abs(numAmount),
          type: "ADMIN_ADJUSTMENT",
          referenceId: `ADM-ADJ-${Date.now()}`,
          description: `Admin manual debit by ${admin.user.username}: ${cleanReason}`,
          tx,
        });
      }

      // Record audit log
      await tx.auditLog.create({
        data: {
          adminId: admin.user.id,
          action: "ADJUST_COIN",
          targetType: "USER",
          targetId: targetUser.id,
          details: JSON.stringify({
            targetEmail: targetUser.email,
            amount: numAmount,
            reason: cleanReason,
            balanceBefore: walletOp.balanceBefore,
            balanceAfter: walletOp.balanceAfter,
          }),
        },
      });

      return walletOp;
    });

    return NextResponse.json({
      success: true,
      message: `Coins adjusted successfully! New balance: ${result.balanceAfter} coins.`,
      balanceAfter: result.balanceAfter,
    });
  } catch (error: any) {
    console.error("Coin adjustment error:", error);
    return NextResponse.json({ error: error?.message || "Failed to adjust coins" }, { status: 400 });
  }
}
