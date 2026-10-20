import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { username } = await req.json();

    if (!username || username.trim().length < 3 || username.trim().length > 20) {
      return NextResponse.json(
        { error: "Username must be between 3 and 20 alphanumeric characters" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();

    // Check availability
    const taken = await prisma.user.findFirst({
      where: {
        username: cleanUsername,
        id: { not: auth.user.id },
      },
    });

    if (taken) {
      return NextResponse.json({ error: "Username is already in use by another user" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: auth.user.id },
      data: { username: cleanUsername },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully!",
      username: updated.username,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
