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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all";

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { username: { contains: search } },
      ];
    }

    if (filter === "suspended") {
      where.isSuspended = true;
    } else if (filter === "unverified") {
      where.isVerified = false;
    } else if (filter === "admin") {
      where.role = "ADMIN";
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isVerified: true,
        isSuspended: true,
        suspensionReason: true,
        suspendedAt: true,
        coinBalance: true,
        createdAt: true,
        _count: {
          select: { orders: true, transactions: true },
        },
      },
      take: 100,
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { searchParams } = new URL(req.url);
    let userId = searchParams.get("id");

    if (!userId) {
      try {
        const body = await req.json();
        userId = body.userId;
      } catch {
        // no body
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    if (userId === admin.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own administrator account." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Cascade delete user data cleanly in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete user's redeem code usages
      await tx.redeemCodeUsage.deleteMany({ where: { userId } });
      // Delete user's coin transactions
      await tx.coinTransaction.deleteMany({ where: { userId } });
      // Delete user's orders and items
      const userOrders = await tx.order.findMany({ where: { userId }, select: { id: true } });
      if (userOrders.length > 0) {
        const orderIds = userOrders.map((o) => o.id);
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }
      // Delete user's task completions & AFK sessions
      await tx.taskCompletion.deleteMany({ where: { userId } });
      await tx.afkSession.deleteMany({ where: { userId } });
      // Delete payment requests
      await tx.paymentRequest.deleteMany({ where: { userId } });
      // Delete OTPs & password reset tokens
      await tx.emailOtp.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      // Nullify or delete created codes
      await tx.redeemCode.updateMany({
        where: { createdById: userId },
        data: { createdById: null },
      });
      // Delete audit logs created by this user
      await tx.auditLog.deleteMany({ where: { adminId: userId } });

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } });

      // Record audit log by the executing admin
      await tx.auditLog.create({
        data: {
          adminId: admin.user!.id,
          action: "DELETE_USER",
          targetType: "USER",
          targetId: userId,
          details: JSON.stringify({
            deletedUsername: targetUser.username,
            deletedEmail: targetUser.email,
            coinBalance: targetUser.coinBalance,
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.username} (${targetUser.email}) has been permanently deleted.`,
    });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete user." },
      { status: 500 }
    );
  }
}
