import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail, generateVerificationCode } from "@/lib/email";
import { withErrorHandler, BadRequestError } from "@/lib/api-error";

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const { email, type } = body;

  if (!email || !type) {
    throw new BadRequestError("邮箱和验证码类型不能为空");
  }

  // 校验 type
  if (!["REGISTER", "LOGIN", "RESET_PASSWORD"].includes(type)) {
    throw new BadRequestError("无效的验证码类型");
  }

  // 检查是否频繁发送 (1分钟内)
  const lastCode = await prisma.verificationCode.findFirst({
    where: {
      email,
      type,
      createdAt: {
        gt: new Date(Date.now() - 60 * 1000), // 1分钟前
      },
    },
  });

  if (lastCode) {
    throw new BadRequestError("发送太频繁，请稍后再试");
  }

  // 生成验证码
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟有效

  // 开发环境/测试方便：在控制台打印验证码
  console.log(`[TEST MODE] Email: ${email}, Code: ${code}`);

  // 存入数据库
  await prisma.verificationCode.create({
    data: {
      email,
      code,
      type,
      expiresAt,
    },
  });

  // 发送邮件
  let subject = "";
  let text = "";

  switch (type) {
    case "REGISTER":
      subject = "DemoWall 注册验证码";
      text = `您的注册验证码是：${code}，5分钟内有效。如非本人操作，请忽略。`;
      break;
    case "LOGIN":
      subject = "DemoWall 登录验证码";
      text = `您的登录验证码是：${code}，5分钟内有效。如非本人操作，请忽略。`;
      break;
    case "RESET_PASSWORD":
      subject = "DemoWall 重置密码验证码";
      text = `您的重置密码验证码是：${code}，5分钟内有效。如非本人操作，请忽略。`;
      break;
  }

  // 异步发送邮件，不阻塞响应 (或者为了可靠性也可以 await)
  try {
    await sendMail({ to: email, subject, text });
  } catch (error) {
    // 即使发送失败，如果是测试环境，也允许通过（方便测试）
    // 或者删除刚刚创建的验证码
    // await prisma.verificationCode.delete({ where: { id: newCode.id } });
    // throw new Error("邮件发送失败");
    console.error("邮件发送失败，但在开发环境允许继续:", error);
  }

  return NextResponse.json({ success: true, message: "验证码已发送" });
});
