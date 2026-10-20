import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Valid reset token and a new password with at least 8 characters are required" },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt !== null) {
      return NextResponse.json(
        { error: "Invalid or already used password reset link." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(resetRecord.expiresAt)) {
      return NextResponse.json(
        { error: "This password reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);

    // Update password and invalidate token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Send security alert email
    await sendEmail({
      to: resetRecord.user.email,
      templateType: "PASSWORD_CHANGED",
      variables: {
        username: resetRecord.user.username,
        date: new Date().toLocaleString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
