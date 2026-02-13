
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // 1. 鉴权
    const payload = await verifyAuth(request);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const query = searchParams.get("q") || "";
    const skip = (page - 1) * limit;

    const where: any = {
      role: { not: "ADMIN" }, // 排除管理员
    };

    if (query) {
      where.OR = [
        { username: { contains: query } },
        { email: { contains: query } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              products: true,
              followedBy: true, // 粉丝数
              following: true,  // 关注数
            },
          },
          // 聚合计算获赞数和收藏数（统计该用户发布的所有产品的获赞/收藏总和）
          products: {
            select: {
              likes: true,
              favorites: true,
            }
          }
        },
      }),
    ]);

    // 格式化返回数据
    const items = users.map((u) => {
      // 计算总获赞数和总收藏数
      const totalLikesReceived = u.products.reduce((acc, p) => acc + p.likes, 0);
      const totalFavoritesReceived = u.products.reduce((acc, p) => acc + p.favorites, 0);

      return {
        id: u.id,
        username: u.username,
        email: u.email,
        avatar: u.avatar,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        stats: {
          products: u._count.products,
          followers: u._count.followedBy,
          following: u._count.following,
          likesReceived: totalLikesReceived,
          favoritesReceived: totalFavoritesReceived,
        },
      };
    });

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin Users API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
