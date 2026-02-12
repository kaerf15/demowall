import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { withErrorHandler, UnauthorizedError, BadRequestError } from "@/lib/api-error";

// 获取评论列表
export const GET = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = verifyAuth(request as NextRequest);
  const userId = user?.userId;

  const { id } = await params;

  const comments = await prisma.comment.findMany({
    where: {
      productId: id,
      parentId: null, // 只获取顶级评论
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      descendants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          parent: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                }
              }
            }
          },
          likedBy: userId ? {
            where: {
              userId: String(userId),
            },
            select: {
              userId: true,
            }
          } : false,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      likedBy: userId ? {
        where: {
          userId: String(userId),
        },
        select: {
          userId: true,
        }
      } : false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 处理评论数据，添加 hasLiked 字段
  const processedComments = comments.map((comment: any) => ({
    ...comment,
    hasLiked: !!(comment.likedBy && comment.likedBy.length > 0),
    replies: comment.descendants.map((reply: any) => ({
      ...reply,
      hasLiked: !!(reply.likedBy && reply.likedBy.length > 0),
      replyToUser: reply.parent?.id !== comment.id ? reply.parent?.user : null
    }))
  }));
  
  return NextResponse.json(processedComments);
});

// 发表评论
export const POST = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = verifyAuth(request as NextRequest);
  if (!user) {
    throw new UnauthorizedError("请先登录");
  }

  const { id } = await params;
  const body = await request.json();
  const { content, parentId } = body;

  if (!content || !content.trim()) {
    throw new BadRequestError("评论内容不能为空");
  }

  let parsedParentId: string | null = null;
  if (parentId !== undefined && parentId !== null) {
    parsedParentId = parentId;
  }

  let rootId = null;
  if (parsedParentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parsedParentId },
      select: { id: true, rootId: true }
    });
    
    if (parentComment) {
      // 如果父评论有rootId，说明它是子评论，沿用rootId
      // 如果父评论没有rootId，说明它是顶级评论，rootId就是父评论id
      rootId = parentComment.rootId || parentComment.id;
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      productId: id,
      userId: String(user.userId),
      parentId: parsedParentId || null,
      rootId: rootId,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      parent: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            }
          }
        }
      }
    },
  });

  // 返回格式化后的数据
  const formattedComment = {
    ...comment,
    hasLiked: false,
    likes: 0,
    replyToUser: comment.parent?.id !== rootId && comment.parent ? comment.parent.user : null
  };

  return NextResponse.json(formattedComment);
});
