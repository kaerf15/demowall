import { prisma } from "@/lib/prisma";

export interface GetProductsParams {
  category?: string | null;
  search?: string | null;
  type?: string | null;
  userId?: string | null;
  targetUserId?: string | null;
}

export interface CreateProductData {
  name: string;
  description: string;
  detail: string;
  websiteUrl: string;
  githubUrl?: string;
  categoryIds: string[];
  images?: string[];
}

export const productService = {
  async getProducts(params: GetProductsParams) {
    const { category, search, type, userId, targetUserId } = params;

    let orderBy: any = { likes: "desc" };
    let where: any = { published: true };

    // Handle user-specific queries
    if (type && ["created", "liked", "favorited"].includes(type)) {
      const filterUserId = targetUserId || userId;
      
      if (!filterUserId) {
        throw new Error("Unauthorized");
      }

      if (type === "created") {
        where = { userId: filterUserId };
        
        // Only show unpublished products if viewing own profile
        if (userId !== filterUserId) {
          where.published = true;
        }
        
        orderBy = { createdAt: "desc" };
      } else if (type === "liked") {
        where = {
          published: true,
          likedBy: { some: { userId: filterUserId } }
        };
      } else if (type === "favorited") {
        where = {
          published: true,
          favoritedBy: { some: { userId: filterUserId } }
        };
      }
    } else {
      // Public queries
      if (category) {
        if (category === "new") {
          orderBy = { createdAt: "desc" };
        } else if (category === "recommended") {
          orderBy = { likes: "desc" };
        } else if (category !== "all") {
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

    let products = [];
    if (search) {
      // Search logic
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
    } else {
      // Standard query
      products = await prisma.product.findMany({
        where,
        include,
        orderBy,
      });
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

      return products.map(product => ({
        ...product,
        hasLiked: likedProductIds.has(product.id),
        hasFavorited: favoritedProductIds.has(product.id)
      }));
    }

    return products.map(product => ({
      ...product,
      hasLiked: false,
      hasFavorited: false
    }));
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
        published: true,
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
