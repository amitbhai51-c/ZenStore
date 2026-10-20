import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import DOMPurify from "isomorphic-dompurify";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const {
      name,
      slug,
      shortDesc,
      fullDesc,
      categoryId,
      coinPrice,
      isAvailable,
      stockQuantity,
      image,
      deliveryInstructions,
    } = await req.json();

    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let cleanImage = image || existing.image;
    if (cleanImage.includes("<svg")) {
      cleanImage = DOMPurify.sanitize(cleanImage);
    }

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        slug: slug !== undefined ? slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-") : existing.slug,
        shortDesc: shortDesc !== undefined ? shortDesc.trim() : existing.shortDesc,
        fullDesc: fullDesc !== undefined ? fullDesc.trim() : existing.fullDesc,
        categoryId: categoryId || existing.categoryId,
        coinPrice: coinPrice !== undefined ? parseInt(coinPrice, 10) : existing.coinPrice,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : existing.isAvailable,
        stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity, 10) : existing.stockQuantity,
        image: cleanImage,
        deliveryInstructions: deliveryInstructions !== undefined ? deliveryInstructions.trim() : existing.deliveryInstructions,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.user.id,
        action: "UPDATE_PRODUCT",
        targetType: "PRODUCT",
        targetId: updated.id,
        details: JSON.stringify({ name: updated.name, coinPrice: updated.coinPrice, isAvailable: updated.isAvailable }),
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Soft delete/archive to preserve order history integrity
    await prisma.product.update({
      where: { id: params.id },
      data: { isArchived: true, isAvailable: false },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.user.id,
        action: "DELETE_PRODUCT",
        targetType: "PRODUCT",
        targetId: params.id,
        details: JSON.stringify({ name: existing.name }),
      },
    });

    return NextResponse.json({ success: true, message: "Product archived successfully." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
