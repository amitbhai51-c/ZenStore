import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { testSmtpSettings } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { testRecipient } = await req.json();

    const recipient = testRecipient || admin.user.email;

    const smtp = await prisma.smtpSettings.findUnique({
      where: { id: "default" },
    });

    if (!smtp || !smtp.host || !smtp.username) {
      return NextResponse.json(
        { error: "SMTP settings are not configured yet. Please configure and save them first." },
        { status: 400 }
      );
    }

    const testResult = await testSmtpSettings({
      host: smtp.host,
      port: smtp.port,
      username: smtp.username,
      password: smtp.password,
      secure: smtp.secure,
      senderName: smtp.senderName,
      senderEmail: smtp.senderEmail,
      testRecipient: recipient,
    });

    if (!testResult.success) {
      return NextResponse.json(
        { error: `SMTP Connection Test Failed: ${testResult.error}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email successfully dispatched to ${recipient}!`,
      messageId: testResult.messageId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to test SMTP connection" }, { status: 500 });
  }
}
