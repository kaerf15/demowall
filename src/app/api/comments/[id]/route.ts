import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { withErrorHandler, UnauthorizedError, ForbiddenError, NotFoundError } from "@/lib/api-error";

// 删除评论
export const DELETE = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await verifyAuth(request as NextRequest);
  if (!user) {
    throw new UnauthorizedError("请先登录");
  }

  const { id } = await params;

  // 1. 查找评论
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!comment) {
    throw new NotFoundError("评论不存在");
  }

  // 2. 权限检查：只有作者本人可以删除
  if (comment.userId !== user.userId) {
    throw new ForbiddenError("无权删除该评论");
  }

  // 3. 删除评论 (Prisma 配置了 onDelete: Cascade，会自动删除子评论)
  await prisma.comment.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
});
