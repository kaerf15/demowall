import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { withErrorHandler, BadRequestError, UnauthorizedError } from "@/lib/api-error";

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const { username, password } = body;

  // 验证必填字段
  if (!username || !password) {
    throw new BadRequestError("请填写用户名和密码");
  }

  // 查找用户（支持用户名或邮箱登录）
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: username }, // 区分大小写
        { email: username }
      ],
    },
  });

  if (!user) {
    throw new UnauthorizedError("用户名或密码错误");
  }

  // 验证密码
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new UnauthorizedError("用户名或密码错误");
  }

  // 生成 JWT token
  const token = signToken({ userId: user.id, username: user.username });

  // 返回用户信息和 token
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    },
    token,
  });
});
