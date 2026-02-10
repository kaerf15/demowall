
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create Categories
  const categories = [
    { name: "DevTools", slug: "devtools", icon: "terminal" },
    { name: "Productivity", slug: "productivity", icon: "check-square" },
    { name: "Design", slug: "design", icon: "pen-tool" },
    { name: "Marketing", slug: "marketing", icon: "trending-up" },
    { name: "AI", slug: "ai", icon: "cpu" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log("Categories seeded!");

  // Create Products
  const devTools = await prisma.category.findUnique({
    where: { slug: "devtools" },
  });

  if (devTools) {
    await prisma.product.create({
      data: {
        name: "Trae IDE",
        description: "A powerful AI-powered IDE for modern development.",
        websiteUrl: "https://trae.ai",
        imageUrl: "https://trae.ai/og-image.png",
        makerName: "Trae Team",
        makerEmail: "hello@trae.ai",
        categoryId: devTools.id,
        published: true,
        upvotes: 120,
      },
    });
  }
  
  console.log("Products seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
