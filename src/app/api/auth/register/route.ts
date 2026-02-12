import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { withErrorHandler, BadRequestError } from "@/lib/api-error";

// 预设头像列表 - 已移除
// export const PRESET_AVATARS = [...];

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const { username, email, password, avatar } = body;

  // 验证必填字段
  if (!username || !password) {
    throw new BadRequestError("请填写所有必填字段");
  }

  // 验证用户名格式（只允许字母、数字、下划线，且长度不超过15字符）
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new BadRequestError("用户名只能包含字母、数字和下划线");
  }
  if (username.length > 15) {
    throw new BadRequestError("用户名不能超过15个字符");
  }

  // 验证邮箱格式 (如果提供了邮箱)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestError("请输入有效的邮箱地址");
  }

  // 验证密码长度
  if (password.length < 6) {
    throw new BadRequestError("密码至少需要6个字符");
  }

  // 检查用户名是否已存在
  const existingUserByUsername = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUserByUsername) {
    throw new BadRequestError("该用户名已被使用");
  }

  // 检查邮箱是否已存在 (如果提供了邮箱)
  if (email) {
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new BadRequestError("该邮箱已被注册");
    }
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 10);

  // 选择头像（使用提供的头像或默认占位符）
  const userAvatar = avatar || "/placeholder-avatar.png";

  // 创建用户
  const user = await prisma.user.create({
    data: {
      username,
      email: email || null,
      password: hashedPassword,
      avatar: userAvatar,
    },
  });

  // 生成 JWT token
  const token = signToken({ userId: user.id, username: user.username });

  // 返回用户信息和 token
  return NextResponse.json(
    {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
      token,
    },
    { status: 201 }
  );
});
