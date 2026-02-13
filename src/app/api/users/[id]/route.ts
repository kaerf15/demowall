import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { withErrorHandler, NotFoundError } from "@/lib/api-error";

export const GET = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const targetUserId = id;

  // 1. Get User
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      username: true,
      avatar: true,
      bio: true,
      title: true,
      contact: true,
      createdAt: true,
    }
  });

  if (!user) {
    throw new NotFoundError("用户不存在");
  }

  // 2. Stats
  // 获取关注数
  const followingCount = await prisma.follow.count({
    where: { followerId: targetUserId },
  });

  // 获取粉丝数
  const followersCount = await prisma.follow.count({
    where: { followingId: targetUserId },
  });

  // 获取获赞数 (所有发布产品的点赞总和)
  const products = await prisma.product.findMany({
    where: { userId: targetUserId, status: "PUBLISHED" },
    select: { likes: true, favorites: true },
  });

  const likesCount = products.reduce((acc, curr) => acc + curr.likes, 0);
  const favoritesCount = products.reduce((acc, curr) => acc + curr.favorites, 0);
  const publishedProductsCount = products.length;

  // 3. Check isFollowing (if logged in)
  let isFollowing = false;
  try {
     const authUser = await verifyAuth(request as NextRequest);
     if (authUser && String(authUser.userId) !== targetUserId) {
        const follow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: String(authUser.userId),
                    followingId: targetUserId
                }
            }
        });
        isFollowing = !!follow;
     }
  } catch (e) {
    // ignore
  }

  return NextResponse.json({
    user,
    stats: {
        followingCount,
        followersCount,
        likesCount,
        favoritesCount,
        publishedProductsCount,
        totalLikesAndFavorites: likesCount + favoritesCount,
    },
    isFollowing
  });
});
