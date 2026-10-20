import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp, hashOtp } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        otps: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      // Prevent user enumeration: respond generically
      return NextResponse.json({ message: "If an account with this email exists, a new OTP has been sent." });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "Account is already verified. Please proceed to login." });
    }

    const latestOtp = user.otps[0];
    const now = new Date();

    if (latestOtp) {
      // 60 seconds cooldown
      const secondsSinceLastSent = (now.getTime() - new Date(latestOtp.lastSentAt).getTime()) / 1000;
      if (secondsSinceLastSent < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceLastSent);
        return NextResponse.json(
          { error: `Please wait ${waitSeconds} seconds before requesting a new code.` },
          { status: 429 }
        );
      }

      if (latestOtp.resendCount >= 5) {
        return NextResponse.json(
          { error: "Maximum OTP resend limit reached. Please contact support." },
          { status: 429 }
        );
      }
    }

    const newOtp = generateOtp();
    const newOtpHash = hashOtp(newOtp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    if (latestOtp) {
      await prisma.emailOtp.update({
        where: { id: latestOtp.id },
        data: {
          otpHash: newOtpHash,
          expiresAt,
          attempts: 0,
          resendCount: latestOtp.resendCount + 1,
          lastSentAt: now,
        },
      });
    } else {
      await prisma.emailOtp.create({
        data: {
          userId: user.id,
          otpHash: newOtpHash,
          expiresAt,
          attempts: 0,
          resendCount: 1,
          lastSentAt: now,
        },
      });
    }

    await sendEmail({
      to: user.email,
      templateType: "OTP_VERIFY",
      variables: {
        username: user.username,
        otp: newOtp,
        expiresMinutes: 10,
      },
    });

    return NextResponse.json({
      success: true,
      message: "A new 6-digit verification code has been sent to your email.",
    });
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    return NextResponse.json({ error: "Failed to resend verification code" }, { status: 500 });
  }
}
