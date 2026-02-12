
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Unsplash 真实图片列表，涵盖各种风格，用于随机分配
const productImages = [
  "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80",
  "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80",
  "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  "https://images.unsplash.com/photo-1555421689-492a18d9c3ad?w=800&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
  "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
  "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
  "https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=800&q=80",
  "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=800&q=80",
  "https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=800&q=80",
  "https://images.unsplash.com/photo-1531297461136-8219647b3801?w=800&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
  "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&q=80",
  "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80",
];

const makerNames = ["Alex", "Sarah", "Mike", "Emma", "David", "Lisa", "Tom", "Anna", "John", "Kate"];
const makerAvatars = [
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateDescription(index: number): string {
  const descriptions = [
    `这是一款革命性产品，帮助你大幅提升效率。`,
    `最受爱好者欢迎的工具，拥有超过百万用户。`,
    `基于AI技术的解决方案，为您带来前所未有的体验。`,
    `专业的平台，集成多项核心功能，一站式解决您的需求。`,
    `简约而不简单的应用，设计优雅，功能强大。`,
    `专为专业人士打造，提供深度定制化服务。`,
    `2026年类目最佳创新奖得主，不容错过。`,
    `重新定义体验，让复杂的流程变得简单直观。`,
    `智能化的助手，懂你的需求，更懂你的习惯。`,
    `连接生态的桥梁，为您创造更多价值。`,
  ];
  return descriptions[index % descriptions.length];
}

async function main() {
  // Clean up existing data
  console.log("Cleaning up database...");
  await prisma.commentLike.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.product.deleteMany({}); // Delete products first (relation cleanup)
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // Reset sequence for SQLite
  // try {
  //    await prisma.$executeRawUnsafe("DELETE FROM sqlite_sequence WHERE name='User'");
  // } catch (e) {
  //   console.log("sqlite_sequence cleanup skipped");
  // }

  // Create Users
  console.log("Seeding users...");
  const users = [];
  
  // Note: bcrypt hash for "password123"
  const defaultPassword = await bcrypt.hash("password123", 10);
  
  // 50 realistic users
  const realisticNames = [
    "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth",
    "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
    "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra",
    "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
    "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa", "Edward", "Deborah"
  ];

  for (let i = 0; i < realisticNames.length; i++) {
    const name = realisticNames[i];
    // Add some randomness to emails to avoid potential conflicts if script runs multiple times
    const emailSuffix = Math.floor(Math.random() * 1000);
    const user = await prisma.user.create({
      data: {
        username: name,
        email: `${name.toLowerCase()}${emailSuffix}@example.com`,
        password: defaultPassword,
        avatar: makerAvatars[i % makerAvatars.length],
        bio: `Hello, I'm ${name}. I love exploring new products and technologies.`,
        title: ["Product Manager", "Developer", "Designer", "Indie Hacker"][i % 4],
        contact: `Email: ${name.toLowerCase()}${emailSuffix}@example.com\nTwitter: @${name.toLowerCase()}`,
      }
    });
    users.push(user);
  }
  console.log(`Created ${users.length} users starting from ID ${users[0].id}`);

  // Create Categories with order
  const categories = [
    { name: "推荐", slug: "recommended", icon: "star", type: "system" },
    { name: "最新", slug: "new", icon: "sparkles", type: "system" }, // New system category
    { name: "工具", slug: "tools", icon: "tool" },
    { name: "效率", slug: "productivity", icon: "zap" },
    { name: "社交", slug: "social", icon: "users" },
    { name: "智能体", slug: "agents", icon: "bot" },
    { name: "摄影与录像", slug: "photo-video", icon: "camera" },
    { name: "娱乐", slug: "entertainment", icon: "film" },
    { name: "生活", slug: "lifestyle", icon: "coffee" },
    { name: "健康健美", slug: "health-fitness", icon: "activity" },
    { name: "教育", slug: "education", icon: "book-open" },
    { name: "商务", slug: "business", icon: "briefcase" },
    { name: "财务", slug: "finance", icon: "dollar-sign" },
    { name: "外贸", slug: "foreign-trade", icon: "globe" },
    { name: "购物", slug: "shopping", icon: "shopping-bag" },
    { name: "导航", slug: "navigation", icon: "navigation" },
    { name: "音乐", slug: "music", icon: "music" },
    { name: "图书", slug: "books", icon: "book" },
    { name: "新闻", slug: "news", icon: "newspaper" },
    { name: "硬件", slug: "hardware", icon: "cpu" },
    { name: "美食佳饮", slug: "food-drink", icon: "coffee" },
    { name: "旅游", slug: "travel", icon: "map" },
    { name: "体育", slug: "sports", icon: "target" },
    { name: "其他", slug: "other", icon: "more-horizontal" },
  ];

  const createdCategories: Record<string, string> = {};
  const normalCategoryIds: string[] = [];

  console.log("Seeding categories...");
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const category = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        type: cat.type || "normal",
        order: i,
      },
    });
    createdCategories[cat.slug] = category.id;
    if (!cat.type || cat.type === "normal") {
      normalCategoryIds.push(category.id);
    }
  }

  console.log("Categories seeded!");

  console.log("Seeding 150 products with random categories...");
  
  for (let i = 1; i <= 150; i++) {
    const maker = getRandomItem(users);
    const numCategories = Math.floor(Math.random() * 3) + 1; // 1 to 3 categories
    const selectedCategoryIds = getRandomItems(normalCategoryIds, numCategories);

    await prisma.product.create({
      data: {
        name: `虚拟产品 ${i}号`,
        description: generateDescription(i),
        websiteUrl: "https://example.com",
        imageUrl: getRandomItem(productImages),
        userId: maker.id,
        status: "PUBLISHED",
        likes: Math.floor(Math.random() * 500) + 10,
        favorites: Math.floor(Math.random() * 200) + 5,
        categories: {
          connect: selectedCategoryIds.map(id => ({ id })),
        },
      },
    });
  }
  
  console.log("150 Dummy products seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
