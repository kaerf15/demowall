import { prisma } from "@/lib/prisma";

export interface GetProductsParams {
  category?: string | null;
  search?: string | null;
  type?: string | null;
  userId?: string | null;
  targetUserId?: string | null;
  cursor?: string | null;
  limit?: number;
  status?: string | null;
}

export interface CreateProductData {
  name: string;
  description: string;
  detail: string;
  websiteUrl: string;
  githubUrl?: string;
  categoryIds: string[];
  images?: string[];
  status?: string;
}

export const productService = {
  async getProducts(params: GetProductsParams) {
    const { category, search, type, userId, targetUserId, cursor, limit = 10, status } = params;

    let orderBy: any = [{ likes: "desc" }, { id: "desc" }];
    let where: any = { status: "PUBLISHED" };

    // Handle user-specific queries
    if (type && ["created", "liked", "favorited"].includes(type)) {
      const filterUserId = targetUserId || userId;
      
      if (!filterUserId) {
        throw new Error("Unauthorized");
      }

      if (type === "created") {
        where = { userId: filterUserId, status: "PUBLISHED" };
        
        // Only show unpublished products if viewing own profile
        if (userId !== filterUserId) {
          // Keep status="PUBLISHED"
        } else if (status) {
          where.status = status;
        }
        
        orderBy = [{ createdAt: "desc" }, { id: "desc" }];
      } else if (type === "liked") {
        where = {
          status: "PUBLISHED",
          likedBy: { some: { userId: filterUserId } }
        };
      } else if (type === "favorited") {
        where = {
          status: "PUBLISHED",
          favoritedBy: { some: { userId: filterUserId } }
        };
      }
    } else {
      // Public queries
      if (category) {
        if (category === "new") {
          orderBy = [{ createdAt: "desc" }, { id: "desc" }];
          // Only show products created within the last 15 days
          const date = new Date();
          date.setDate(date.getDate() - 15);
          where.createdAt = {
            gte: date
          };
        } else if (category !== "all" && category !== "recommended") {
          where.categories = { some: { slug: category } };
        }
      }
    }

    const include = {
      categories: true,
      tags: true,
      user: {
        select: {
          username: true,
          avatar: true,
          title: true,
        },
      },
    };

    // If cursor is provided, add it to where clause
    // Note: This simple cursor implementation assumes sorting by a unique field or combination
    // For complex sorting (like 'likes'), we need a more robust cursor strategy (e.g. [likes, id])
    // Here we'll implement a basic one and might need to adjust based on sorting strategy
    let cursorObj = undefined;
    if (cursor) {
      cursorObj = { id: cursor };
    }

    let products = [];
    let nextCursor = null;

    if (search) {
      // Search logic (Client-side filtering for search, no cursor support for now or simple limit)
      // For search, we might want to just return top N results or implement offset-based pagination if needed
      // But since we are doing in-memory sorting for search, cursor pagination is tricky.
      // We will ignore cursor for search and just return limit results or all results.
      const searchWhere = {
        ...where,
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
          { user: { username: { contains: search } } },
          { categories: { some: { name: { contains: search } } } }
        ],
      };

      const allProducts = await prisma.product.findMany({
        where: searchWhere,
        include,
      });

      // In-memory weighted sorting
      products = allProducts.sort((a, b) => {
        const getWeight = (product: typeof allProducts[0]) => {
          let weight = 0;
          const searchLower = search.toLowerCase();
          
          if (product.name.toLowerCase().includes(searchLower)) weight += 100;
          if (product.description.toLowerCase().includes(searchLower)) weight += 50;
          if (product.categories.some(c => c.name.toLowerCase().includes(searchLower))) weight += 30;
          if (product.user?.username.toLowerCase().includes(searchLower)) weight += 10;

          return weight;
        };
        return getWeight(b) - getWeight(a);
      });
      
      // Since search is in-memory, we can just slice it
      // But to support infinite scroll with search, we'd need to keep track of offset.
      // For now, let's return all for search or just slice the first 'limit' if no cursor logic for search.
      // Or better: Search usually resets list.
    } else {
      // Standard query with Cursor Pagination
      products = await prisma.product.findMany({
        where,
        include,
        orderBy,
        take: limit + 1, // Fetch one more to check if there is a next page
        cursor: cursorObj,
        skip: cursor ? 1 : 0, // Skip the cursor itself
      });

      if (products.length > limit) {
        const nextItem = products.pop(); // Remove the extra item
        nextCursor = nextItem?.id;
      }
    }

    // Enhance with user specific data if userId is provided
    // This is NOT ideal for large datasets but works for now to solve N+1
    // A better approach would be to include this in the initial query if possible
    // or use a separate efficient query to fetch all likes/favorites for these product IDs
    if (userId) {
      const productIds = products.map(p => p.id);
      
      const [likedProductIds, favoritedProductIds] = await Promise.all([
        prisma.like.findMany({
          where: {
            userId,
            productId: { in: productIds }
          },
          select: { productId: true }
        }).then(likes => new Set(likes.map(l => l.productId))),
        
        prisma.favorite.findMany({
          where: {
            userId,
            productId: { in: productIds }
          },
          select: { productId: true }
        }).then(favs => new Set(favs.map(f => f.productId)))
      ]);

      const enhancedProducts = products.map(product => ({
        ...product,
        hasLiked: likedProductIds.has(product.id),
        hasFavorited: favoritedProductIds.has(product.id)
      }));

      return {
        items: enhancedProducts,
        nextCursor
      };
    }

    const enhancedProducts = products.map(product => ({
      ...product,
      hasLiked: false,
      hasFavorited: false
    }));

    return {
      items: enhancedProducts,
      nextCursor
    };
  },

  async createProduct(data: CreateProductData, userId: string) {
    // Validate categoryIds
    if (!Array.isArray(data.categoryIds) || data.categoryIds.length === 0 || data.categoryIds.length > 3) {
      throw new Error("请选择1-3个分类");
    }

    // Get user info for maker details
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      throw new Error("用户不存在");
    }

    return prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        detail: data.detail,
        websiteUrl: data.websiteUrl || "",
        githubUrl: data.githubUrl,
        userId: userId,
        imageUrl: data.images && data.images.length > 0 ? data.images[0] : null,
        images: data.images ? JSON.stringify(data.images) : undefined,
        categories: {
          connect: data.categoryIds.map((id) => ({ id })),
        },
        status: data.status || "DRAFT",
      },
    });
  },

  async getProductById(id: string, userId?: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        categories: true,
        tags: true,
        user: {
          select: {
            title: true,
            avatar: true,
            username: true,
          },
        },
      },
    });

    if (!product) return null;

    if (userId) {
      const [hasLiked, hasFavorited] = await Promise.all([
        prisma.like.findUnique({
          where: {
            userId_productId: {
              userId,
              productId: id,
            },
          },
        }),
        prisma.favorite.findUnique({
          where: {
            userId_productId: {
              userId,
              productId: id,
            },
          },
        }),
      ]);

      return {
        ...product,
        hasLiked: !!hasLiked,
        hasFavorited: !!hasFavorited,
      };
    }

    return {
      ...product,
      hasLiked: false,
      hasFavorited: false,
    };
  },

  async likeProduct(userId: string, productId: string) {
    // Check if user is the author
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { userId: true },
    });

    if (!product) {
      throw new Error("产品不存在");
    }

    if (product.userId === userId) {
      throw new Error("不能给自己点赞");
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingLike) {
      throw new Error("已经点赞过了");
    }

    return prisma.$transaction([
      prisma.like.create({
        data: {
          userId,
          productId,
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { likes: { increment: 1 } },
      }),
    ]);
  },

  async unlikeProduct(userId: string, productId: string) {
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!existingLike) {
      throw new Error("还没有点赞");
    }

    return prisma.$transaction([
      prisma.like.delete({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { likes: { decrement: 1 } },
      }),
    ]);
  },

  async getLikeStatus(userId: string | null, productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { likes: true },
    });

    if (!product) {
      throw new Error("产品不存在");
    }

    let hasLiked = false;
    if (userId) {
      const like = await prisma.like.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });
      hasLiked = !!like;
    }

    return {
      likes: product.likes,
      hasLiked,
    };
  },

  async deleteProduct(productId: string, userId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("产品不存在");
    }

    if (product.userId !== userId) {
      throw new Error("无权删除此产品");
    }

    return prisma.product.delete({
      where: { id: productId },
    });
  }
};
