import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = user.userId;

    // 获取关注数
    const followingCount = await prisma.follow.count({
      where: { followerId: userId },
    });

    // 获取粉丝数
    const followersCount = await prisma.follow.count({
      where: { followingId: userId },
    });

    // 获取获赞数 (所有发布产品的点赞总和)
    const products = await prisma.product.findMany({
      where: { userId: userId, status: "PUBLISHED" },
      select: { likes: true, favorites: true },
    });

    const likesCount = products.reduce((acc, curr) => acc + curr.likes, 0);
    const favoritesCount = products.reduce((acc, curr) => acc + curr.favorites, 0);
    const publishedProductsCount = products.length;

    return NextResponse.json({
      stats: {
        followingCount: followingCount,
        followersCount: followersCount,
        likesCount: likesCount,
        favoritesCount: favoritesCount,
        publishedProductsCount: publishedProductsCount,
        totalLikesAndFavorites: likesCount + favoritesCount,
      },
    });
  } catch (error) {
    console.error("获取统计数据失败:", error);
    return NextResponse.json({ error: "获取统计数据失败" }, { status: 500 });
  }
}
