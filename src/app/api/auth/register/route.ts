import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateOtp, hashOtp } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Please provide a valid email address").toLowerCase().trim(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .trim(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parse = registerSchema.safeParse(body);

    if (!parse.success) {
      const issue = parse.error.issues?.[0];
      return NextResponse.json(
        { error: issue?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { email, username, password } = parse.data;

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
      if (existing.email === email) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
      }
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create unverified user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        isVerified: false,
        coinBalance: 0,
      },
    });

    // Generate 6-digit OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.emailOtp.create({
      data: {
        userId: user.id,
        otpHash,
        expiresAt,
        attempts: 0,
        resendCount: 0,
        lastSentAt: new Date(),
      },
    });

    // Send verification email
    await sendEmail({
      to: email,
      templateType: "OTP_VERIFY",
      variables: {
        username,
        otp,
        expiresMinutes: 10,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Registration initiated. Please verify the OTP sent to your email.",
      email: user.email,
      userId: user.id,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred during registration" },
      { status: 500 }
    );
  }
}
