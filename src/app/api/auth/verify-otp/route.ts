import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashOtp, generateToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp || typeof otp !== "string" || otp.length !== 6) {
      return NextResponse.json({ error: "Please enter the valid 6-digit OTP" }, { status: 400 });
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "Account is already verified. Please log in." });
    }

    const latestOtp = user.otps[0];
    if (!latestOtp) {
      return NextResponse.json({ error: "No pending verification code found. Please request a new OTP." }, { status: 400 });
    }

    // Check expiration
    if (new Date() > new Date(latestOtp.expiresAt)) {
      return NextResponse.json({ error: "OTP has expired. Please click resend to get a new code." }, { status: 400 });
    }

    // Check attempts limit
    if (latestOtp.attempts >= 5) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new OTP." },
        { status: 429 }
      );
    }

    // Verify hash
    const submittedHash = hashOtp(otp.trim());
    if (submittedHash !== latestOtp.otpHash) {
      await prisma.emailOtp.update({
        where: { id: latestOtp.id },
        data: { attempts: latestOtp.attempts + 1 },
      });
      return NextResponse.json(
        { error: `Invalid verification code. ${4 - latestOtp.attempts} attempts remaining.` },
        { status: 400 }
      );
    }

    // Mark user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    // Delete used OTP
    await prisma.emailOtp.delete({
      where: { id: latestOtp.id },
    });

    // Send Welcome Email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendEmail({
      to: user.email,
      templateType: "WELCOME",
      variables: {
        username: user.username,
        email: user.email,
        loginUrl: `${appUrl}/auth/login`,
      },
    });

    // Generate JWT Session Token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Email verified successfully! Welcome to CoinCraft.",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isVerified: true,
        coinBalance: user.coinBalance,
      },
    });

    // Set HTTP-only Cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}
