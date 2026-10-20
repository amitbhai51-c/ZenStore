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

    const { userId, action, reason } = await req.json();

    if (!userId || !action || !["suspend", "unsuspend"].includes(action)) {
      return NextResponse.json({ error: "Invalid action parameters" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (targetUser.role === "ADMIN") {
      return NextResponse.json({ error: "Cannot suspend another administrator" }, { status: 400 });
    }

    if (action === "suspend") {
      if (!reason || reason.trim().length < 3) {
        return NextResponse.json(
          { error: "A mandatory reason is required to suspend an account." },
          { status: 400 }
        );
      }

      const cleanReason = reason.trim();

      await prisma.user.update({
        where: { id: targetUser.id },
        data: {
          isSuspended: true,
          suspensionReason: cleanReason,
          suspendedAt: new Date(),
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          adminId: admin.user.id,
          action: "SUSPEND_USER",
          targetType: "USER",
          targetId: targetUser.id,
          details: JSON.stringify({
            targetEmail: targetUser.email,
            reason: cleanReason,
          }),
        },
      });

      // Send suspension email with reason
      await sendEmail({
        to: targetUser.email,
        templateType: "ACCOUNT_SUSPENDED",
        variables: {
          username: targetUser.username,
          suspensionReason: cleanReason,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Account for ${targetUser.username} has been suspended.`,
      });
    } else {
      // Unsuspend
      await prisma.user.update({
        where: { id: targetUser.id },
        data: {
          isSuspended: false,
          suspensionReason: null,
          suspendedAt: null,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          adminId: admin.user.id,
          action: "UNSUSPEND_USER",
          targetType: "USER",
          targetId: targetUser.id,
          details: JSON.stringify({
            targetEmail: targetUser.email,
          }),
        },
      });

      // Send unsuspension email
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await sendEmail({
        to: targetUser.email,
        templateType: "ACCOUNT_UNSUSPENDED",
        variables: {
          username: targetUser.username,
          loginUrl: `${appUrl}/auth/login`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Account for ${targetUser.username} has been reinstated.`,
      });
    }
  } catch (error: any) {
    console.error("Suspension error:", error);
    return NextResponse.json({ error: "Failed to update suspension status" }, { status: 500 });
  }
}
