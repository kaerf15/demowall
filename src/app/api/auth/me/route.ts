import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 获取用户信息
    const dbUser = await prisma.user.findUnique({
      where: { id: String(user.userId) },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        contact: true,
        bio: true,
        title: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error("获取用户信息错误:", error);
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
}
