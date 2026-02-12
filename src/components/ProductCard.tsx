"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { toast } from "sonner";
import { useLikeProduct, useFavoriteProduct } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  action?: React.ReactNode;
}

export function ProductCard({ product, onClick, action }: ProductCardProps) {
  const { mutate: toggleLike, isPending: isLikePending } = useLikeProduct();
  const { mutate: toggleFavorite, isPending: isFavoritePending } = useFavoriteProduct();
  const { user, isAuthenticated } = useAuth();
  
  const currentUserId = user?.id;

  const isAuthor = Boolean(currentUserId && product.userId && String(currentUserId) === String(product.userId));

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAuthor) {
      toast.error("不能给自己点赞");
      return;
    }

    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }

    toggleLike({ id: product.id, isLiked: !!product.hasLiked });
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAuthor) {
      toast.error("不能收藏自己的作品");
      return;
    }

    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }

    toggleFavorite({ id: product.id, isFavorited: !!product.hasFavorited });
  };

  return (
    <Card 
      className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 border border-border/50 bg-card cursor-pointer p-1 gap-0"
      onClick={onClick}
    >
      <div className="aspect-video relative overflow-hidden bg-muted">
        {product.status === 'DRAFT' && (
           <div className="absolute top-2 left-2 z-10">
             <Badge variant="destructive" className="bg-yellow-500/80 text-white border-0 hover:bg-yellow-600/80 text-[10px] px-1.5 py-0.5">
               草稿
             </Badge>
           </div>
        )}
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <span className="text-4xl">🚀</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <CardContent className="p-1.5">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors flex-1">
            {product.name}
          </h3>
          <div className="flex gap-1 shrink-0 flex-wrap justify-end max-w-[40%]">
            {product.categories
              ?.filter((cat) => !cat.type || cat.type === "normal")
              .slice(0, 3)
              .map((cat) => (
                <Badge
                  key={cat.id}
                  variant="secondary"
                  className="bg-primary/10 text-primary border-0 hover:bg-primary/20 text-[10px] px-1 py-0 h-4 whitespace-nowrap"
                >
                  {cat.name}
                </Badge>
              ))}
          </div>
        </div>
        <p className="text-muted-foreground text-xs line-clamp-2 mb-1 leading-snug">
          {product.description}
        </p>
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <Link
            href={product.userId ? `/users/${product.userId}` : "#"}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[10px] font-semibold shadow-sm overflow-hidden">
              {product.user?.avatar ? (
                <Image
                  src={product.user.avatar}
                  alt={product.user.username || "User"}
                  width={20}
                  height={20}
                  className="w-full h-full object-cover"
                />
              ) : (
                (product.user?.username || "U").charAt(0).toUpperCase()
              )}
            </div>
            <span className="text-xs font-medium text-foreground truncate max-w-[80px]">
              {product.user?.username || "Unknown"}
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {action && (
              <div className="mr-1" onClick={(e) => e.stopPropagation()}>
                {action}
              </div>
            )}
            {/* 点赞按钮 */}
            <button
              onClick={handleLike}
              disabled={isLikePending || isAuthor}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-all duration-200 ${
                isAuthor 
                  ? "opacity-50 cursor-not-allowed bg-secondary/50 text-muted-foreground" 
                  : product.hasLiked
                    ? "bg-red-500 text-white"
                    : "bg-secondary/50 text-muted-foreground hover:bg-red-50 hover:text-red-500"
              }`}
              title={isAuthor ? "不能给自己点赞" : undefined}
            >
              <Heart
                className={`w-3 h-3 ${product.hasLiked ? "fill-current" : ""}`}
              />
              <span className="text-xs font-medium">{product.likes}</span>
            </button>

            {/* 收藏按钮 */}
            <button
              onClick={handleFavorite}
              disabled={isFavoritePending || isAuthor}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-all duration-200 ${
                isAuthor 
                  ? "opacity-50 cursor-not-allowed bg-secondary/50 text-muted-foreground" 
                  : product.hasFavorited
                    ? "bg-yellow-400 text-white"
                    : "bg-secondary/50 text-muted-foreground hover:bg-yellow-50 hover:text-yellow-400"
              }`}
              title={isAuthor ? "不能收藏自己的作品" : undefined}
            >
              <Star
                className={`w-3 h-3 ${product.hasFavorited ? "fill-current" : ""}`}
              />
              <span className="text-xs font-medium">{product.favorites}</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}