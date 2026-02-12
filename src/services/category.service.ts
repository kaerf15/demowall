import { prisma } from "@/lib/prisma";

export const categoryService = {
  async getCategories() {
    return prisma.category.findMany({
      orderBy: { order: "asc" },
    });
  },
};
