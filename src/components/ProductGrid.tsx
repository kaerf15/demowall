"use client";

import { ProductCard } from "./ProductCard";

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  websiteUrl: string;
  makerName: string;
  makerAvatar: string | null;
  category: {
    name: string;
    slug: string;
  };
  upvotes: number;
}

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          暂无产品
        </h3>
        <p className="text-gray-600">
          还没有产品被添加到这个分类中
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}