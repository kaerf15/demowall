
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { deleteFileFromOSS } from "@/lib/oss";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // 1. 获取产品信息以便删除 OSS 文件
    const product = await prisma.product.findUnique({
      where: { id },
      select: { imageUrl: true, images: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 2. 删除数据库记录
    await prisma.product.delete({
      where: { id },
    });
    
    // 3. 记录审计
    await prisma.auditLog.create({
      data: {
        adminId: payload.userId,
        action: "DELETE_PRODUCT",
        targetType: "PRODUCT",
        targetId: id,
        details: JSON.stringify({ reason: "Admin deleted product", name: product.imageUrl }),
      },
    });

    // 4. (Async) 清理 OSS 文件
    (async () => {
      try {
        if (product.imageUrl) {
          await deleteFileFromOSS(product.imageUrl);
        }
        
        if (product.images) {
          let images: string[] = [];
          try {
             // images stored as JSON string in DB
             images = JSON.parse(product.images as string);
          } catch (e) {
             console.error("Failed to parse product images JSON:", e);
          }
          
          if (Array.isArray(images)) {
            await Promise.all(images.map(img => deleteFileFromOSS(img)));
          }
        }
      } catch (err) {
        console.error("Background OSS cleanup failed:", err);
      }
    })();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Product Error:", error);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
