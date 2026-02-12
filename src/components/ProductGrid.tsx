"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { ProductCard } from "./ProductCard";
import { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export function ProductGrid({ 
  products, 
  onProductClick,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: ProductGridProps) {
  const [columns, setColumns] = useState(1);
  const [mounted, setMounted] = useState(false);
  const { ref, inView } = useInView({
    rootMargin: "200px", // Trigger loading 200px before reaching bottom
  });

  useEffect(() => {
    if (inView && hasMore && !isLoadingMore) {
      onLoadMore?.();
    }
  }, [inView, hasMore, isLoadingMore, onLoadMore]);

  useEffect(() => {
    // Wrap setMounted in requestAnimationFrame or setTimeout to avoid synchronous update warning
    const timer = setTimeout(() => setMounted(true), 0);
    
    const updateColumns = () => {
      if (window.matchMedia("(min-width: 1536px)").matches) {
        setColumns(5);
      } else if (window.matchMedia("(min-width: 1280px)").matches) {
        setColumns(4);
      } else if (window.matchMedia("(min-width: 1024px)").matches) {
        setColumns(3);
      } else if (window.matchMedia("(min-width: 640px)").matches) {
        setColumns(2);
      } else {
        setColumns(1);
      }
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => {
      window.removeEventListener("resize", updateColumns);
      clearTimeout(timer);
    };
  }, []);

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <span className="text-5xl">🔍</span>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          暂无产品
        </h3>
        <p className="text-muted-foreground">
          还没有产品被添加到这个分类中
        </p>
      </div>
    );
  }

  // Initial render (SSR/Hydration) uses standard grid to prevent layout shift
  if (!mounted) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-1">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="animate-fadeIn"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ProductCard
              product={product}
              onClick={() => onProductClick?.(product)}
            />
          </div>
        ))}
      </div>
    );
  }

  // Masonry Layout Logic
  const columnProducts = Array.from({ length: columns }, () => [] as { product: Product, index: number }[]);
  products.forEach((product, index) => {
    columnProducts[index % columns].push({ product, index });
  });

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex gap-1 items-start">
        {columnProducts.map((col, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-1 flex-1 min-w-0">
            {col.map(({ product, index }) => (
              <div
                key={product.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ProductCard
                  product={product}
                  onClick={() => onProductClick?.(product)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Infinite Scroll Loader */}
      <div ref={ref} className="flex justify-center py-4 w-full">
        {isLoadingMore ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary/20 border-t-primary" />
            <span className="text-sm">加载更多...</span>
          </div>
        ) : hasMore ? (
          <div className="h-4" /> // Invisible trigger area
        ) : products.length > 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            没有更多内容了
          </div>
        ) : null}
      </div>
    </div>
  );
}
