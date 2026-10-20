import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "coincraft_default_secret_minimum_32_chars_vault";
export const AUTH_COOKIE_NAME = "coincraft_token";

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function generateOtp(): string {
  // Cryptographically secure 6-digit OTP
  return crypto.randomInt(100000, 999999).toString();
}

export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function generateResetToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

export async function getSessionUser(req?: NextRequest) {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
  } else {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      // In non-server context
    }
  }

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isVerified: true,
      isSuspended: true,
      suspensionReason: true,
      coinBalance: true,
      createdAt: true,
    },
  });

  return user;
}

export async function requireAuth(req?: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return { error: "Authentication required", status: 401, user: null };
  }

  if (user.isSuspended) {
    return {
      error: `Your account has been suspended: ${user.suspensionReason || "Violation of terms"}`,
      status: 403,
      user: null,
      isSuspended: true,
    };
  }

  if (!user.isVerified) {
    return {
      error: "Email verification required before accessing this feature",
      status: 403,
      user: null,
      isUnverified: true,
    };
  }

  return { error: null, status: 200, user };
}

export async function requireAdmin(req?: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return auth;
  }

  if (auth.user.role !== "ADMIN") {
    return { error: "Administrative privileges required", status: 403, user: null };
  }

  return { error: null, status: 200, user: auth.user };
}
