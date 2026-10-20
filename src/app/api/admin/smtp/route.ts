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

    const smtp = await prisma.smtpSettings.findUnique({
      where: { id: "default" },
    });

    return NextResponse.json({
      smtp: {
        host: smtp?.host || "",
        port: smtp?.port || 587,
        username: smtp?.username || "",
        passwordMasked: smtp?.password ? "••••••••••••" : "",
        secure: smtp?.secure || false,
        senderName: smtp?.senderName || "CoinCraft Store",
        senderEmail: smtp?.senderEmail || "noreply@coincraft.local",
        isConfigured: smtp?.isConfigured || false,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load SMTP settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { host, port, username, password, secure, senderName, senderEmail } = await req.json();

    const existing = await prisma.smtpSettings.findUnique({
      where: { id: "default" },
    });

    const finalPassword = password && password.trim() !== "" ? password : existing?.password || "";
    const parsedPort = parseInt(port, 10) || 587;
    // For Port 465, secure must default to true unless explicitly unchecked as false
    const finalSecure = parsedPort === 465 ? (secure === false ? false : true) : Boolean(secure);

    const updated = await prisma.smtpSettings.upsert({
      where: { id: "default" },
      update: {
        host: host?.trim() || "",
        port: parsedPort,
        username: username?.trim() || "",
        password: finalPassword,
        secure: finalSecure,
        senderName: senderName?.trim() || "CoinCraft Store",
        senderEmail: senderEmail?.trim() || "noreply@coincraft.local",
        isConfigured: Boolean(host && username),
      },
      create: {
        id: "default",
        host: host?.trim() || "",
        port: parsedPort,
        username: username?.trim() || "",
        password: finalPassword,
        secure: finalSecure,
        senderName: senderName?.trim() || "CoinCraft Store",
        senderEmail: senderEmail?.trim() || "noreply@coincraft.local",
        isConfigured: Boolean(host && username),
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.user.id,
        action: "UPDATE_SMTP",
        targetType: "SETTING",
        targetId: "default",
        details: JSON.stringify({ host: updated.host, port: updated.port, senderEmail: updated.senderEmail }),
      },
    });

    return NextResponse.json({ success: true, message: "SMTP configuration updated successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update SMTP configuration" }, { status: 500 });
  }
}
