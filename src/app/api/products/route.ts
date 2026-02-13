import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { productService } from "@/services/product.service";
import { withErrorHandler, UnauthorizedError } from "@/lib/api-error";

export const GET = withErrorHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const type = searchParams.get("type"); // "created" | "liked" | "favorited"
  const targetUserIdParam = searchParams.get("userId");
  const targetUserId = targetUserIdParam || undefined;
  const cursor = searchParams.get("cursor");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam) : 10;
  const status = searchParams.get("status") || undefined;

  let userId: string | undefined;

  // 尝试获取当前登录用户，即使用户不要求特定 type
  // 这样可以在所有查询中返回 hasLiked/hasFavorited 状态
  try {
    const user = await verifyAuth(request as NextRequest);
    if (user) {
      userId = String(user.userId);
    }
  } catch (e) {
    // 忽略 token 验证错误，视为未登录
  }

  // 如果是用户相关的强制查询，需要验证登录或提供 targetUserId
  if (type && ["created", "liked", "favorited"].includes(type)) {
    if (!userId && !targetUserId) {
      throw new UnauthorizedError("请先登录或指定用户");
    }
  }

  const result = await productService.getProducts({
    category,
    search,
    type,
    userId,
    targetUserId,
    cursor,
    limit,
    status,
  });

  const formattedItems = result.items.map((product) => ({
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }));

  return NextResponse.json({
    items: formattedItems,
    nextCursor: result.nextCursor
  });
});

export const POST = withErrorHandler(async (request: Request) => {
  const user = await verifyAuth(request as NextRequest);
  if (!user) {
    throw new UnauthorizedError("请先登录");
  }

  const body = await request.json();
  const {
    name,
    description,
    detail,
    websiteUrl,
    githubUrl,
    categoryIds,
    images,
    status,
  } = body;

  const product = await productService.createProduct(
    {
      name,
      description,
      detail,
      websiteUrl,
      githubUrl,
      categoryIds,
      images,
      status,
    },
    user.userId
  );

  return NextResponse.json(product, { status: 201 });
});
