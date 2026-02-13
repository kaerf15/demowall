import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyAuth } from "@/lib/auth";
import { withErrorHandler, BadRequestError, UnauthorizedError } from "@/lib/api-error";

export const PUT = withErrorHandler(async (request: Request) => {
  const user = await verifyAuth(request as NextRequest);
  if (!user) {
    throw new UnauthorizedError("请先登录");
  }

  const body = await request.json();
  const { oldPassword, newPassword } = body;

  if (!oldPassword || !newPassword) {
    throw new BadRequestError("请填写旧密码和新密码");
  }

  if (newPassword.length < 6) {
    throw new BadRequestError("新密码至少需要6个字符");
  }

  // 1. 获取当前用户密码
  const currentUser = await prisma.user.findUnique({
    where: { id: user.userId },
  });

  if (!currentUser) {
    throw new UnauthorizedError("用户不存在");
  }

  // 2. 验证旧密码
  const isValidPassword = await bcrypt.compare(oldPassword, currentUser.password);
  if (!isValidPassword) {
    throw new BadRequestError("旧密码错误");
  }

  // 3. 更新密码
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.userId },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ success: true, message: "密码修改成功" });
});
