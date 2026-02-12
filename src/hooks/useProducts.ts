import { useInfiniteQuery, useMutation, useQueryClient, useQuery, InfiniteData } from "@tanstack/react-query";
import { Product } from "@/types";

interface UseProductsOptions {
  category?: string | null;
  search?: string;
  type?: string | null;
  userId?: string | null;
  enabled?: boolean;
}

interface ProductsResponse {
  items: Product[];
  nextCursor?: string | null;
}

async function fetchProducts({ category, search, type, userId, pageParam }: UseProductsOptions & { pageParam?: string | null }): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (category && category !== "all") params.append("category", category);
  if (search) params.append("search", search);
  if (type) params.append("type", type);
  if (userId) params.append("userId", userId.toString());
  if (pageParam) params.append("cursor", pageParam);
  params.append("limit", "12"); // Fetch 12 items per page

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`/api/products?${params.toString()}`, { headers });
  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }
  const data = await res.json();
  
  // Backwards compatibility if API returns array directly (during migration)
  if (Array.isArray(data)) {
    return { items: data, nextCursor: null };
  }
  
  return {
    items: Array.isArray(data.items) ? data.items : [],
    nextCursor: data.nextCursor
  };
}

async function toggleLikeProduct({ id, isLiked }: { id: string; isLiked: boolean }): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Unauthorized");

  const method = isLiked ? "DELETE" : "POST";
  const res = await fetch(`/api/products/${id}/like`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("token"); // 清除无效 Token
      window.location.reload(); // 刷新页面以重置状态
      throw new Error("请重新登录");
    }
    const error = await res.json();
    throw new Error(error.error || "Failed to toggle like");
  }
}

async function toggleFavoriteProduct({ id, isFavorited }: { id: string; isFavorited: boolean }): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Unauthorized");

  const method = isFavorited ? "DELETE" : "POST";
  const res = await fetch(`/api/products/${id}/favorite`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.reload();
      throw new Error("请重新登录");
    }
    const error = await res.json();
    throw new Error(error.error || "Failed to toggle favorite");
  }
}

export function useProducts(options: UseProductsOptions = {}) {
  return useInfiniteQuery({
    queryKey: ["products", options.category, options.search, options.type, options.userId],
    queryFn: ({ pageParam }) => fetchProducts({ ...options, pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60 * 1000,
    enabled: options.enabled,
  });
}

export function useLikeProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleLikeProduct,
    onMutate: async ({ id, isLiked }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["products"] });
      await queryClient.cancelQueries({ queryKey: ["product", id] });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueriesData({ queryKey: ["products"] });
      const previousProduct = queryClient.getQueryData(["product", id]);

      // Optimistically update products lists
      queryClient.setQueriesData({ queryKey: ["products"] }, (old: InfiniteData<ProductsResponse> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            items: page.items.map(product => {
              if (product.id === id) {
                return {
                  ...product,
                  hasLiked: !isLiked,
                  likes: isLiked ? product.likes - 1 : product.likes + 1,
                };
              }
              return product;
            })
          }))
        };
      });

      // Optimistically update single product
      if (previousProduct) {
        queryClient.setQueryData(["product", id], (old: Product) => ({
          ...old,
          hasLiked: !isLiked,
          likes: isLiked ? old.likes - 1 : old.likes + 1,
        }));
      }

      return { previousProducts, previousProduct };
    },
    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousProducts) {
        context.previousProducts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousProduct) {
        queryClient.setQueryData(["product", variables.id], context.previousProduct);
      }
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
  });
}

export function useFavoriteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleFavoriteProduct,
    onMutate: async ({ id, isFavorited }) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      await queryClient.cancelQueries({ queryKey: ["product", id] });

      const previousProducts = queryClient.getQueriesData({ queryKey: ["products"] });
      const previousProduct = queryClient.getQueryData(["product", id]);

      queryClient.setQueriesData({ queryKey: ["products"] }, (old: InfiniteData<ProductsResponse> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            items: page.items.map(product => {
              if (product.id === id) {
                return {
                  ...product,
                  hasFavorited: !isFavorited,
                  favorites: isFavorited ? product.favorites - 1 : product.favorites + 1,
                };
              }
              return product;
            })
          }))
        };
      });

      if (previousProduct) {
        queryClient.setQueryData(["product", id], (old: Product) => ({
          ...old,
          hasFavorited: !isFavorited,
          favorites: isFavorited ? old.favorites - 1 : old.favorites + 1,
        }));
      }

      return { previousProducts, previousProduct };
    },
    onError: (err, variables, context) => {
      if (context?.previousProducts) {
        context.previousProducts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousProduct) {
        queryClient.setQueryData(["product", variables.id], context.previousProduct);
      }
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
  });
}

// Add hook for single product fetching (for deep linking)
async function fetchProduct(id: string): Promise<Product> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`/api/products/${id}`, { headers });
  if (!res.ok) {
    throw new Error("Product not found");
  }
  return res.json();
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id!),
    enabled: !!id, // Only fetch if id is provided
  });
}
