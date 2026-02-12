import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { productService } from "@/services/product.service";
import { deleteFileFromOSS } from "@/lib/oss";

// GET handler
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let userId: string | undefined;

    try {
      const user = verifyAuth(request);
      if (user) {
        userId = String(user.userId);
      }
    } catch (e) {
      // 忽略 token 验证错误，视为未登录
    }
    
    const product = await productService.getProductById(id, userId);

    if (!product) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 });
    }

    const formattedProduct = {
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };

    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "获取产品详情失败" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      detail,
      websiteUrl,
      githubUrl,
      categoryIds,
      status,
    } = body;

    // 1. 检查产品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { categories: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 });
    }

    // 2. 检查权限
    if (existingProduct.userId !== String(user.userId)) {
      return NextResponse.json({ error: "无权修改此产品" }, { status: 403 });
    }

    // 3. 验证数据
    if (!name || !description) {
      return NextResponse.json({ error: "请填写必填字段" }, { status: 400 });
    }

    if (categoryIds && (!Array.isArray(categoryIds) || categoryIds.length === 0 || categoryIds.length > 3)) {
      return NextResponse.json({ error: "请选择1-3个分类" }, { status: 400 });
    }

    // 4. 检查重名 (如果修改了名称)
    if (name !== existingProduct.name) {
      const duplicateProduct = await prisma.product.findFirst({
        where: {
          userId: user.userId,
          name: name,
          id: { not: id }, // 排除当前产品
        },
      });

      if (duplicateProduct) {
        return NextResponse.json(
          { error: "您已存在同名产品，请使用其他名称" },
          { status: 400 }
        );
      }
    }

    // 5. 更新产品
    const updateData: any = {
      name,
      description,
      detail,
      websiteUrl: websiteUrl || "",
      githubUrl,
      status: status,
    };

    if (categoryIds) {
      updateData.categories = {
        set: categoryIds.map((cid: string) => ({ id: cid })),
      };
    }

    // 处理图片更新
    if (body.images && Array.isArray(body.images)) {
      // 1. 获取旧图片列表
      let oldImages: string[] = [];
      if (existingProduct.images) {
        try {
          const parsed = JSON.parse(existingProduct.images as string);
          if (Array.isArray(parsed)) oldImages = parsed;
        } catch (e) {
          console.error("Failed to parse old images", e);
        }
      } else if (existingProduct.imageUrl) {
        oldImages = [existingProduct.imageUrl];
      }

      const newImages = body.images as string[];

      // 2. 找出被删除的图片 (在旧列表中但不在新列表中)
      const deletedImages = oldImages.filter(img => !newImages.includes(img));

      // 3. 异步删除被移除的图片
      deletedImages.forEach(url => {
        deleteFileFromOSS(url).catch(console.error);
      });

      // 4. 更新数据库字段
      updateData.imageUrl = newImages.length > 0 ? newImages[0] : null; // 第一张作为封面
      updateData.images = JSON.stringify(newImages);
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { categories: true },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "更新失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 6. 删除产品相关图片
    // 获取产品图片信息
    const product = await prisma.product.findUnique({
      where: { id },
      select: { imageUrl: true, images: true }
    });

    if (product) {
      // 删除封面图
      if (product.imageUrl) {
        deleteFileFromOSS(product.imageUrl).catch(console.error);
      }
      
      // 删除多图
      if (product.images) {
        try {
          const images = JSON.parse(product.images as string);
          if (Array.isArray(images)) {
            images.forEach((url: string) => {
              // 避免重复删除封面图（如果封面图也在 images 列表中）
              if (url !== product.imageUrl) {
                deleteFileFromOSS(url).catch(console.error);
              }
            });
          }
        } catch (e) {
          console.error("解析图片列表失败", e);
        }
      }
    }

    await productService.deleteProduct(id, String(user.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    if (error instanceof Error && error.message === "产品不存在") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === "无权删除此产品") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "删除产品失败" },
      { status: 500 }
    );
  }
}
