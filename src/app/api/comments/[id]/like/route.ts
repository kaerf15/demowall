import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { withErrorHandler, UnauthorizedError, BadRequestError } from "@/lib/api-error";

// 点赞评论
export const POST = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = verifyAuth(request as any);
  if (!user) {
    throw new UnauthorizedError("请先登录");
  }

  const { id } = await params;
  const commentId = id;

  // 检查是否已经点赞
  const existingLike = await prisma.commentLike.findUnique({
    where: {
      userId_commentId: {
        userId: String(user.userId),
        commentId: commentId,
      },
    },
  });

  if (existingLike) {
    throw new BadRequestError("已经点赞过了");
  }

  // 使用事务确保数据一致性
  await prisma.$transaction([
    prisma.commentLike.create({
      data: {
        userId: String(user.userId),
        commentId: commentId,
      },
    }),
    prisma.comment.update({
      where: { id: commentId },
      data: {
        likes: {
          increment: 1,
        },
      },
    }),
  ]);

  return NextResponse.json({ success: true, hasLiked: true });
});

// 取消点赞
export const DELETE = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = verifyAuth(request as any);
  if (!user) {
    throw new UnauthorizedError("请先登录");
  }

  const { id } = await params;
  const commentId = id;

  const existingLike = await prisma.commentLike.findUnique({
    where: {
      userId_commentId: {
        userId: String(user.userId),
        commentId: commentId,
      },
    },
  });

  if (!existingLike) {
    throw new BadRequestError("尚未点赞");
  }

  // 使用事务确保数据一致性
  await prisma.$transaction([
    prisma.commentLike.delete({
      where: {
        userId_commentId: {
          userId: String(user.userId),
          commentId: commentId,
        },
      },
    }),
    prisma.comment.update({
      where: { id: commentId },
      data: {
        likes: {
          decrement: 1,
        },
      },
    }),
  ]);

  return NextResponse.json({ success: true, hasLiked: false });
});
