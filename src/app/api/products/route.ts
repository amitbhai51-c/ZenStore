import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const availability = searchParams.get("availability") || "all";
    const sort = searchParams.get("sort") || "newest";

    const where: any = {
      isArchived: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { shortDesc: { contains: search } },
      ];
    }

    if (category && category !== "all") {
      where.category = {
        slug: category,
      };
    }

    if (availability === "available") {
      where.isAvailable = true;
      where.stockQuantity = { gt: 0 };
    } else if (availability === "out_of_stock") {
      where.OR = [{ isAvailable: false }, { stockQuantity: { lte: 0 } }];
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "price_asc") {
      orderBy = { coinPrice: "asc" };
    } else if (sort === "price_desc") {
      orderBy = { coinPrice: "desc" };
    } else if (sort === "name_asc") {
      orderBy = { name: "asc" };
    }

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.productCategory.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ products, categories });
  } catch (error) {
    console.error("Fetch products error:", error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
