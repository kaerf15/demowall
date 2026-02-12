"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "./ProductCard";
import { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
}

export function ProductGrid({ products, onProductClick }: ProductGridProps) {
  const [columns, setColumns] = useState(1);
  const [mounted, setMounted] = useState(false);

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
  );
}
