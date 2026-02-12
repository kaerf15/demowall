import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Product } from "@/types";
import { useCategories } from "@/hooks/useCategories";
import { useProducts, useProduct, useLikeProduct } from "@/hooks/useProducts";

export function useHomeLogic() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const searchParams = useSearchParams();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Data Fetching Hooks
  const { data: rawCategories = [], isLoading: categoriesLoading } = useCategories();
  const categories = Array.isArray(rawCategories) ? rawCategories.filter(c => c.slug !== "recommended") : [];
  
  const { 
    data, 
    isLoading: productsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useProducts({
    category: selectedCategory,
    search: debouncedSearchQuery,
  });

  const products = data ? data.pages.flatMap(page => page.items || []) : [];

  const { mutate: toggleLike } = useLikeProduct();

  // Sync selectedProduct with fresh data from products list to ensure optimistic updates are reflected in dialog
  useEffect(() => {
    if (selectedProduct) {
      const freshProduct = products.find(p => p.id === selectedProduct.id);
      if (freshProduct && (
        freshProduct.likes !== selectedProduct.likes || 
        freshProduct.hasLiked !== selectedProduct.hasLiked || 
        freshProduct.favorites !== selectedProduct.favorites || 
        freshProduct.hasFavorited !== selectedProduct.hasFavorited
      )) {
        // Wrap in setTimeout to avoid setting state during render
        const timer = setTimeout(() => setSelectedProduct(freshProduct), 0);
        return () => clearTimeout(timer);
      }
    }
  }, [products, selectedProduct]);

  // Deep link handling
  const productIdFromUrl = searchParams.get("product");
  const productInList = products.find((p) => p.id === productIdFromUrl);
  
  // Only fetch single product if not found in current list and ID is present
  const { data: deepLinkedProduct } = useProduct(
    !productInList ? productIdFromUrl : null
  );

  useEffect(() => {
    if (productIdFromUrl) {
      const targetProduct = productInList || deepLinkedProduct;
      if (targetProduct) {
         // Wrap in setTimeout to avoid setting state during render
         const timer = setTimeout(() => {
            setSelectedProduct(targetProduct);
            setDialogOpen(true);
         }, 0);
         return () => clearTimeout(timer);
      }
    }
  }, [productIdFromUrl, productInList, deepLinkedProduct]);

  const handleCategoryChange = (slug: string | null) => {
    setSelectedCategory(slug);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleUpvote = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      toggleLike({ id: productId, isLiked: !!product.hasLiked });
    }
  };

  return {
    // State
    selectedCategory,
    searchQuery,
    selectedProduct,
    dialogOpen,
    categories,
    products,
    isLoading: categoriesLoading || productsLoading,

    // Actions
    setDialogOpen,
    handleCategoryChange,
    handleSearch,
    handleProductClick,
    handleUpvote,
    
    // Pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
