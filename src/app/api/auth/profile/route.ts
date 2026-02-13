import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { deleteFileFromOSS } from "@/lib/oss";

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { username, email, avatar, contact, bio, title } = body;

    // 验证必填字段
    if (!username) {
      return NextResponse.json(
        { error: "用户名不能为空" },
        { status: 400 }
      );
    }

    // 验证用户名格式 (允许任何字符)
    if (username.length > 20) {
      return NextResponse.json(
        { error: "用户名不能超过20个字符" },
        { status: 400 }
      );
    }

    // 验证邮箱格式 (如果提供了邮箱)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "请输入有效的邮箱地址" },
        { status: 400 }
      );
    }

    // 检查用户名是否被其他用户占用
    const existingUserByUsername = await prisma.user.findFirst({
      where: {
        username,
        id: { not: String(user.userId) }, // 排除自己
      },
    });

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: "该用户名已被使用" },
        { status: 400 }
      );
    }

    // 检查邮箱是否被其他用户占用
    if (email) {
      const existingUserByEmail = await prisma.user.findFirst({
        where: {
          email,
          id: { not: String(user.userId) }, // 排除自己
        },
      });

      if (existingUserByEmail) {
        return NextResponse.json(
          { error: "该邮箱已被使用" },
          { status: 400 }
        );
      }
    }

    // 6. 获取旧用户信息以便比较
    const oldUser = await prisma.user.findUnique({
      where: { id: String(user.userId) },
      select: { avatar: true },
    });

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: String(user.userId) },
      data: {
        username,
        email: email || null,
        avatar,
        contact: contact || null,
        bio: bio || null,
        title: title || null,
      },
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

    // 如果头像发生了变化，且旧头像存在，则删除旧头像
    // 只有当新头像不为空且与旧头像不同时才删除旧头像
    if (avatar && oldUser?.avatar && avatar !== oldUser.avatar) {
      // 异步删除，不阻塞响应
      deleteFileFromOSS(oldUser.avatar).catch(console.error);
    }

    // 如果修改了用户名，需要重新签发 token (因为 token 中包含 username)
    // 但为了简化，这里暂时不重签，或者可以选择返回新 token
    // 实际场景中，建议仅在 Token 中存储 userId，这样修改用户名不影响 token 有效性

    return NextResponse.json({ user: updatedUser });

  } catch (error) {
    console.error("更新个人信息错误:", error);
    return NextResponse.json(
      { error: "更新失败，请稍后重试" },
      { status: 500 }
    );
  }
}
