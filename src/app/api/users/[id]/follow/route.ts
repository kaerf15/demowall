import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

// Check follow status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ isFollowing: false });
    }

    const { id } = await params; // target user id
    const targetUserId = id;

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: String(user.userId),
          followingId: targetUserId,
        },
      },
    });

    return NextResponse.json({ isFollowing: !!follow });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json(
      { error: "Failed to check follow status" },
      { status: 500 }
    );
  }
}

// Follow user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params; // target user id
    const targetUserId = id;

    if (String(user.userId) === targetUserId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: String(user.userId),
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json({ message: "Already following" }, { status: 400 });
    }

    await prisma.follow.create({
      data: {
        followerId: String(user.userId),
        followingId: targetUserId,
      },
    });

    return NextResponse.json({ success: true, isFollowing: true });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

// Unfollow user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params; // target user id
    const targetUserId = id;

    await prisma.follow.deleteMany({
      where: {
        followerId: String(user.userId),
        followingId: targetUserId,
      },
    });

    return NextResponse.json({ success: true, isFollowing: false });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}
