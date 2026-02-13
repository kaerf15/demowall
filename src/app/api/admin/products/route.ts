
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const query = searchParams.get("q") || "";
    const status = searchParams.get("status"); // DRAFT, PUBLISHED
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
      ];
    }
    
    if (status) {
      where.status = status;
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              comments: true,
            },
          },
          user: { // 关联作者信息
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    // 格式化
    const items = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      imageUrl: p.imageUrl,
      status: p.status,
      createdAt: p.createdAt,
      author: p.user,
      stats: {
        likes: p.likes,
        favorites: p.favorites,
        comments: p._count.comments,
      },
    }));

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin Products API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
