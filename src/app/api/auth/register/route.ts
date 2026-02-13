import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { withErrorHandler, BadRequestError } from "@/lib/api-error";

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const { username, email, password, code, avatar } = body;

  // 1. 验证必填字段
  if (!username || !email || !password || !code) {
    throw new BadRequestError("请填写所有必填字段（用户名、邮箱、密码、验证码）");
  }

  // 2. 验证用户名格式 (允许任何字符，仅限制长度)
  if (username.length > 20) {
    throw new BadRequestError("用户名不能超过20个字符");
  }

  // 3. 验证邮箱格式
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestError("请输入有效的邮箱地址");
  }

  // 4. 验证密码长度
  if (password.length < 6) {
    throw new BadRequestError("密码至少需要6个字符");
  }

  // 5. 验证验证码
  const validCode = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      type: "REGISTER",
      expiresAt: { gt: new Date() },
    },
  });

  if (!validCode) {
    throw new BadRequestError("验证码无效或已过期");
  }

  // 6. 检查用户名和邮箱唯一性
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email },
      ],
    },
  });

  if (existingUser) {
    if (existingUser.username === username) {
      throw new BadRequestError("该用户名已被使用");
    }
    if (existingUser.email === email) {
      throw new BadRequestError("该邮箱已被注册");
    }
  }

  // 7. 创建用户
  const hashedPassword = await bcrypt.hash(password, 10);
  // const userAvatar = avatar || "/placeholder-avatar.png"; // 移除不存在的默认头像

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      avatar: avatar || null, // 如果没有头像，存为 null，前端会自动显示首字母
      contact: email, // 默认第一个联系方式为注册邮箱
      lastLoginAt: new Date(), // 注册即首次登录
    },
  });

  // 8. 验证码作废
  await prisma.verificationCode.delete({ where: { id: validCode.id } });

  // 记录登录日志 (注册即登录)
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  await prisma.loginLog.create({
    data: {
      userId: user.id,
      ipAddress: ip,
      userAgent: userAgent,
    }
  });

  // 9. 生成 Token 并返回
  const token = signToken({ 
    userId: user.id, 
    username: user.username,
    role: "USER" 
  });

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
