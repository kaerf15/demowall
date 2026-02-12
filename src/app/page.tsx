"use client";

import { Navbar } from "@/components/Navbar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductDetailDialog } from "@/components/ProductDetailDialog";
import { FluidLogo } from "@/components/FluidLogo";
import { useHomeLogic } from "@/hooks/useHomeLogic";

export default function Home() {
  const {
    selectedCategory,
    searchQuery,
    selectedProduct,
    dialogOpen,
    categories,
    products,
    isLoading,
    setDialogOpen,
    handleCategoryChange,
    handleSearch,
    handleProductClick,
    handleUpvote,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHomeLogic();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} searchQuery={searchQuery} />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-1">
        <div className="flex justify-center mb-1 w-full overflow-hidden">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary" />
              <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-4 border-primary/10" />
            </div>
            <p className="mt-4 text-muted-foreground text-sm">加载中...</p>
          </div>
        ) : (
          <ProductGrid 
            products={products} 
            onProductClick={handleProductClick}
            onLoadMore={fetchNextPage}
            hasMore={hasNextPage}
            isLoadingMore={isFetchingNextPage}
          />
        )}
      </main>

      <ProductDetailDialog
        product={selectedProduct}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpvote={handleUpvote}
      />

      <footer className="bg-card border-t mt-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FluidLogo />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 DemoWall. 独立开发者产品交流社区
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
