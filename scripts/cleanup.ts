import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // 1. 删除所有产品数据 (包括管理员创建的，如果有)
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`已删除 ${deletedProducts.count} 个产品数据`);

    // 2. 删除除 admin 外的所有用户
    // 注意：由于级联删除设置，这将自动删除这些用户的：
    // - Products (如果第一步没删完)
    // - Comments
    // - Likes / Favorites
    // - Follows
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        username: {
          not: "admin"
        }
      }
    });
    console.log(`已删除 ${deletedUsers.count} 个非管理员账号`);

  } catch (error) {
    console.error("清理数据失败:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
