import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import DOMPurify from "isomorphic-dompurify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isArchived: false },
        orderBy: { createdAt: "desc" },
        include: { category: true },
      }),
      prisma.productCategory.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ products, categories });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    if (!name || !slug || !categoryId || !coinPrice) {
      return NextResponse.json(
        { error: "Product name, slug, category, and coin price are required." },
        { status: 400 }
      );
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");

    const existingSlug = await prisma.product.findUnique({
      where: { slug: cleanSlug },
    });

    if (existingSlug) {
      return NextResponse.json({ error: "Product slug already exists" }, { status: 400 });
    }

    // Sanitize image if SVG string
    let cleanImage = image || "gift";
    if (cleanImage.includes("<svg")) {
      cleanImage = DOMPurify.sanitize(cleanImage);
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        shortDesc: shortDesc?.trim() || "",
        fullDesc: fullDesc?.trim() || "",
        categoryId,
        coinPrice: parseInt(coinPrice, 10),
        isAvailable: isAvailable ?? true,
        stockQuantity: parseInt(stockQuantity, 10) || 10,
        image: cleanImage,
        deliveryInstructions: deliveryInstructions?.trim() || null,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        adminId: admin.user.id,
        action: "CREATE_PRODUCT",
        targetType: "PRODUCT",
        targetId: product.id,
        details: JSON.stringify({ name: product.name, slug: product.slug, coinPrice: product.coinPrice }),
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create product" }, { status: 500 });
  }
}
