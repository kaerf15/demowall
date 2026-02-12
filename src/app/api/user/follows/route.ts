import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "following" | "followers"

    if (type === "following") {
      // 获取我关注的人 -> 我是 follower, 这里的 followingId 是我关注的人
      const follows = await prisma.follow.findMany({
        where: { followerId: user.userId },
        orderBy: { createdAt: "desc" },
        select: { followingId: true },
      });
      
      const ids = follows.map(f => f.followingId);
      const users = await prisma.user.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      });
      return NextResponse.json(users);
    } else if (type === "followers") {
      // 获取关注我的人 -> 我是 following, 这里的 followerId 是关注我的人
      const follows = await prisma.follow.findMany({
        where: { followingId: user.userId },
        orderBy: { createdAt: "desc" },
        select: { followerId: true },
      });

      const ids = follows.map(f => f.followerId);
      const users = await prisma.user.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      });
      return NextResponse.json(users);
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error fetching follows:", error);
    return NextResponse.json(
      { error: "Failed to fetch follows" },
      { status: 500 }
    );
  }
}
