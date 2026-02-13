import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { subDays, addHours } from "date-fns";

const prisma = new PrismaClient();

// 简单的随机数据生成器
const adjectives = ["Happy", "Fast", "Smart", "Cool", "Bright", "Super", "Mega", "Hyper", "Cyber", "Tech"];
const nouns = ["Coder", "Dev", "Maker", "Builder", "Ninja", "Wizard", "Guru", "Hero", "Star", "Geek"];
const productPrefixes = ["AI", "Cloud", "Smart", "Auto", "Data", "Code", "Web", "Mobile", "Crypto", "Social"];
const productSuffixes = ["Tool", "App", "Platform", "Hub", "Kit", "Suite", "Bot", "Assistant", "Generator", "Manager"];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomDate(daysBack: number): Date {
  const date = subDays(new Date(), daysBack);
  // 添加随机小时和分钟，使时间更自然
  return addHours(date, getRandomInt(0, 23));
}

async function main() {
  console.log("开始生成模拟数据...");

  // 1. 准备密码哈希
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 2. 生成 100 个用户
  const usersToCreate = 100;
  
  for (let i = 0; i < usersToCreate; i++) {
    const daysAgo = getRandomInt(0, 30); // 注册时间在近30天内
    const createdAt = generateRandomDate(daysAgo);
    
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const username = `${getRandomElement(adjectives)}${getRandomElement(nouns)}_${uniqueSuffix}`;
    const email = `${username.toLowerCase()}@example.com`;

    try {
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: "USER",
          status: "ACTIVE",
          createdAt: createdAt,
          updatedAt: createdAt,
          // 随机生成一些产品
          products: {
            create: Array.from({ length: getRandomInt(5, 15) }).map(() => {
              const prodDaysAgo = getRandomInt(0, daysAgo); // 产品发布时间在用户注册之后（即距今天数更少或相等）
              const prodDate = generateRandomDate(prodDaysAgo);
              
              return {
                name: `${getRandomElement(productPrefixes)} ${getRandomElement(productSuffixes)} ${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
                description: "这是一个非常棒的模拟产品，用于测试系统功能。",
                detail: "## 产品详情\n\n这是一款基于最新技术栈开发的产品...\n\n- 功能强大\n- 界面美观\n- 易于使用",
                websiteUrl: "https://example.com",
                status: "PUBLISHED", // 直接设为发布状态以便统计
                createdAt: prodDate,
                updatedAt: prodDate,
                likes: getRandomInt(0, 100),
                favorites: getRandomInt(0, 50),
              };
            }),
          },
        },
      });
      
      process.stdout.write(`\r已创建用户 ${i + 1}/${usersToCreate}: ${username}`);
    } catch (error) {
      console.error(`\n创建用户失败 (${username}):`, error);
    }
  }

  console.log("\n\n数据生成完成！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
