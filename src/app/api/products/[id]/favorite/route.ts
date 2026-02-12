import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

// 收藏
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;

    // 检查是否已经收藏
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: String(user.userId),
          productId: id,
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json({ error: "已经收藏过了" }, { status: 400 });
    }

    // 检查是否是作者自己
    const product = await prisma.product.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!product) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 });
    }

    if (product.userId === String(user.userId)) {
      return NextResponse.json({ error: "不能收藏自己的作品" }, { status: 400 });
    }

    // 创建收藏记录并更新收藏数
    await prisma.$transaction([
      prisma.favorite.create({
        data: {
          userId: String(user.userId),
          productId: id,
        },
      }),
      prisma.product.update({
        where: { id },
        data: { favorites: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("收藏错误:", error);
    return NextResponse.json({ error: "收藏失败" }, { status: 500 });
  }
}

// 取消收藏
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;

    // 检查是否收藏过
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: String(user.userId),
          productId: id,
        },
      },
    });

    if (!existingFavorite) {
      return NextResponse.json({ error: "还没有收藏" }, { status: 400 });
    }

    // 事务处理：删除收藏记录并更新计数
    await prisma.$transaction([
      prisma.favorite.delete({
        where: {
          userId_productId: {
            userId: String(user.userId),
            productId: id,
          },
        },
      }),
      prisma.product.update({
        where: { id },
        data: { favorites: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("取消收藏错误:", error);
    return NextResponse.json({ error: "取消收藏失败" }, { status: 500 });
  }
}

// 获取收藏状态
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyAuth(request);
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { favorites: true },
    });

    if (!product) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 });
    }

    let hasFavorited = false;
    if (user) {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId: user.userId,
            productId: id,
          },
        },
      });
      hasFavorited = !!favorite;
    }

    return NextResponse.json({
      favorites: product.favorites,
      hasFavorited,
    });
  } catch (error) {
    console.error("获取收藏状态错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
