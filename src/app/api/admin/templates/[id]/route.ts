import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { subject, htmlBody } = await req.json();

    if (!subject || !htmlBody) {
      return NextResponse.json({ error: "Subject and HTML body are required" }, { status: 400 });
    }

    const updated = await prisma.emailTemplate.update({
      where: { id: params.id },
      data: {
        subject: subject.trim(),
        htmlBody: htmlBody.trim(),
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.user.id,
        action: "UPDATE_TEMPLATE",
        targetType: "EMAIL_TEMPLATE",
        targetId: params.id,
        details: JSON.stringify({ type: updated.type, subject: updated.subject }),
      },
    });

    return NextResponse.json({ success: true, template: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update template" }, { status: 500 });
  }
}
