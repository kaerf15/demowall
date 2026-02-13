"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Product } from "@/types";
import { ImageCarousel } from "./ImageCarousel";

interface ProductInfoSectionProps {
  product: Product;
}

export function ProductInfoSection({ product }: ProductInfoSectionProps) {
  const images = useMemo(() => {
    let imgs: string[] = [];
    if (product.images) {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          imgs = parsed;
        }
      } catch (e) {
        console.error("Failed to parse images", e);
      }
    }
    
    if (imgs.length === 0 && product.imageUrl) {
      imgs = [product.imageUrl];
    }
    return imgs;
  }, [product]);

  const ensureProtocol = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  return (
    <div className="p-6 pb-12">
      <div className="flex flex-col gap-3 mb-3">
        <div className="w-full overflow-hidden">
          <h1 className="text-3xl font-bold leading-tight whitespace-nowrap text-ellipsis overflow-hidden" title={product.name}>
            {product.name}
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {product.categories
            ?.filter((cat) => !cat.type || cat.type === "normal")
            .map((cat) => (
              <Badge
                key={cat.id}
                variant="secondary"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border-0 font-medium px-2.5 py-0.5 text-xs rounded-md w-fit"
              >
                {cat.name.replace(/^#/, "")}
              </Badge>
            ))}
        </div>
      </div>
      
      <p className="text-lg text-muted-foreground leading-relaxed mb-6">
        {product.description}
      </p>

      {images.length > 0 && (
        <ImageCarousel images={images} productName={product.name} />
      )}

      {product.websiteUrl && product.websiteUrl.trim() !== "" && (
        <div className="mb-4">
          <a 
            href={ensureProtocol(product.websiteUrl)} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center text-sm text-primary hover:underline font-medium"
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            访问产品链接
          </a>
        </div>
      )}

      {product.detail && (
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              img: ({ node, ...props }) => (
                <div className="relative w-full aspect-video my-6 rounded-lg overflow-hidden">
                  <img {...props} className="w-full h-full object-cover" alt={props.alt || "Product detail image"} />
                </div>
              ),
            }}
          >
            {product.detail}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
