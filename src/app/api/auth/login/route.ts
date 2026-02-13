import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { withErrorHandler, BadRequestError, UnauthorizedError } from "@/lib/api-error";

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const { identifier, credential, type } = body; // type: "password" | "code"

  if (!identifier || !credential || !type) {
    throw new BadRequestError("请填写完整登录信息");
  }

  // 1. 查找用户
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: identifier },
        { email: identifier },
      ],
    },
  });

  if (!user) {
    throw new UnauthorizedError("用户不存在");
  }

  // 2. 验证凭证
  if (type === "password") {
    // 密码登录
    const isValidPassword = await bcrypt.compare(credential, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError("密码错误");
    }
  } else if (type === "code") {
    // 验证码登录 (必须通过邮箱找到用户，因为验证码是发到邮箱的)
    if (!user.email) {
      throw new BadRequestError("该用户未绑定邮箱，无法使用验证码登录");
    }
    
    // 如果 identifier 是用户名，需要确认它关联的邮箱是否匹配
    // 其实上面查到的 user 已经确定了，但我们需要验证码表里是 email
    
    const validCode = await prisma.verificationCode.findFirst({
      where: {
        email: user.email,
        code: credential,
        type: "LOGIN",
        expiresAt: { gt: new Date() },
      },
    });

    if (!validCode) {
      throw new UnauthorizedError("验证码无效或已过期");
    }

    // 删除验证码
    await prisma.verificationCode.delete({ where: { id: validCode.id } });
  } else {
    throw new BadRequestError("不支持的登录方式");
  }

  // 3. 更新最后登录时间
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // 记录登录日志
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  await prisma.loginLog.create({
    data: {
      userId: user.id,
      ipAddress: ip,
      userAgent: userAgent,
    }
  });

  // 4. 生成 Token
  const token = signToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    },
    token,
  });
});
