import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { productService } from "@/services/product.service";

// 点赞
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;

    try {
      await productService.likeProduct(String(user.userId), id);
      return NextResponse.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message === "已经点赞过了") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error("点赞错误:", error);
    return NextResponse.json({ error: "点赞失败" }, { status: 500 });
  }
}

// 取消点赞
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;

    try {
      await productService.unlikeProduct(String(user.userId), id);
      return NextResponse.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message === "还没有点赞") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error("取消点赞错误:", error);
    return NextResponse.json({ error: "取消点赞失败" }, { status: 500 });
  }
}

// 获取点赞状态
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyAuth(request);
    const { id } = await params;

    try {
      const result = await productService.getLikeStatus(
        user ? user.userId : null,
        id
      );
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "产品不存在") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      throw error;
    }
  } catch (error) {
    console.error("获取点赞状态错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
