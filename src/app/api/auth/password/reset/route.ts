import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { withErrorHandler, BadRequestError } from "@/lib/api-error";

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const { email, code, newPassword } = body;

  if (!email || !code || !newPassword) {
    throw new BadRequestError("请填写完整信息");
  }

  if (newPassword.length < 6) {
    throw new BadRequestError("新密码至少需要6个字符");
  }

  // 1. 验证验证码
  const validCode = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      type: "RESET_PASSWORD",
      expiresAt: { gt: new Date() },
    },
  });

  if (!validCode) {
    throw new BadRequestError("验证码无效或已过期");
  }

  // 2. 查找用户
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new BadRequestError("该邮箱未注册");
  }

  // 3. 更新密码
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  // 4. 删除验证码
  await prisma.verificationCode.delete({ where: { id: validCode.id } });

  return NextResponse.json({ success: true, message: "密码重置成功" });
});
