import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { isActive, maxUses, expiresAt } = await req.json();

    const existing = await prisma.redeemCode.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Redeem code not found" }, { status: 404 });
    }

    const updated = await prisma.redeemCode.update({
      where: { id: params.id },
      data: {
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        maxUses: maxUses !== undefined ? parseInt(maxUses, 10) : existing.maxUses,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : existing.expiresAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.user.id,
        action: "UPDATE_REDEEM_CODE",
        targetType: "REDEEM_CODE",
        targetId: updated.id,
        details: JSON.stringify({
          code: updated.code,
          isActive: updated.isActive,
          maxUses: updated.maxUses,
        }),
      },
    });

    return NextResponse.json({ success: true, code: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update redeem code" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const existing = await prisma.redeemCode.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Redeem code not found" }, { status: 404 });
    }

    await prisma.redeemCode.delete({
      where: { id: params.id },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.user.id,
        action: "DELETE_REDEEM_CODE",
        targetType: "REDEEM_CODE",
        targetId: params.id,
        details: JSON.stringify({ code: existing.code }),
      },
    });

    return NextResponse.json({ success: true, message: "Redeem code deleted successfully." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete redeem code" }, { status: 500 });
  }
}
