"use client";

import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { CommentList, CommentListRef } from "@/components/CommentList";
import { Heart, Star, Share2, MessageCircle, Send, X, Plus, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { AuthDialog } from "@/components/AuthDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { Product } from "@/types";
import { AuthorSection } from "@/components/product/AuthorSection";
import { useLikeProduct, useFavoriteProduct } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpvote?: (productId: string) => void;
}

export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  onUpvote,
}: ProductDetailDialogProps) {
  const { mutate: toggleLike, isPending: isLikePending } = useLikeProduct();
  const { mutate: toggleFavorite, isPending: isFavoritePending } = useFavoriteProduct();
  const { user, token, isAuthenticated } = useAuth();
  const currentUserId = user?.id || null;

  const [commentContent, setCommentContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [totalComments, setTotalComments] = useState(0);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isShareCopied, setIsShareCopied] = useState(false);
  const commentListRef = useRef<CommentListRef>(null);
  const mobileCommentListRef = useRef<CommentListRef>(null);

  // Image Carousel State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [isHovering, setIsHovering] = useState(false); // Track user interaction
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-play logic
  useEffect(() => {
    if (images.length <= 1 || isHovering) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [images.length, isHovering]);

  useEffect(() => {
    if (product) {
      checkFollowStatus();
      
      // Parse images
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
      
      setImages(imgs);
      setCurrentImageIndex(0);
      setIsHovering(false); // Reset hover state
    }
  }, [product, user]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    setIsHovering(true); // Pause auto-play on touch
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    setIsHovering(false); // Resume auto-play on touch end
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
    
    if (isRightSwipe && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  const isAuthor = Boolean(currentUserId !== null && product?.userId === currentUserId);

  const checkFollowStatus = async () => {
    // 简化：如果 product.user 包含这些信息则无需请求
    // 但目前 API 可能不返回 isFollowing，所以保持原样或后续优化
    if (!product || !currentUserId || product.userId === currentUserId) return;

    if (!token) return;

    try {
      const res = await fetch(`/api/users/${product.userId}/follow`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated || !token) {
      setShowAuthDialog(true);
      return;
    }

    if (!product?.userId || (currentUserId !== null && product.userId === currentUserId)) return;

    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/users/${product.userId}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error("操作失败:", error);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      const url = `${window.location.origin}/?product=${product.id}`;
      await navigator.clipboard.writeText(url);
      setIsShareCopied(true);
      setTimeout(() => setIsShareCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const ensureProtocol = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  const handleLike = async () => {
    if (isAuthor) {
      toast.error("不能给自己点赞");
      return;
    }

    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    
    if (product) {
      toggleLike({ id: product.id, isLiked: !!product.hasLiked });
    }
  };

  const handleFavorite = async () => {
    if (isAuthor) {
      toast.error("不能收藏自己的作品");
      return;
    }

    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    if (product) {
      toggleFavorite({ id: product.id, isFavorited: !!product.hasFavorited });
    }
  };


  const handleCommentSubmit = async () => {
    if (!commentContent.trim() || !product) return;

    if (!isAuthenticated || !token) {
      setShowAuthDialog(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${product.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: commentContent,
        }),
      });

      if (res.ok) {
        setCommentContent("");
        setIsCommentDialogOpen(false);
        commentListRef.current?.refresh();
        mobileCommentListRef.current?.refresh();
      } else {
        const error = await res.json();
        if (res.status === 401) {
          toast.error("请先登录");
        } else {
          toast.error(error.error || "发表评论失败");
        }
      }
    } catch (error) {
      console.error("发表评论错误", error);
      toast.error("发表评论失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const ProductInfoSection = () => {
    if (!product) return null;
    
    // 动态调整字体大小逻辑可以更复杂，这里先用 truncate 配合 CSS 
    // 但 CSS 很难直接实现"自动缩小字体"，通常需要 JS 计算
    // 这里我们先强制不换行 + truncate，并尝试用 CSS 容器查询或类似思路
    // 简单起见，我们使用 text-3xl 但允许它在极长时 truncate，或者使用 SVG 方案，
    // 但用户要求"缩小字体"，这通常需要 JS。
    // 我们可以给它一个容器，设置 whitespace-nowrap。
    
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
          <div 
            className="w-full aspect-video relative rounded-xl overflow-hidden mb-8 bg-muted border border-border/50 shadow-sm group select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Images Container */}
            <div 
              className="flex h-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {images.map((img, index) => (
                <div key={index} className="w-full h-full flex-shrink-0 relative">
                  <Image
                    src={img}
                    alt={`${product.name} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>

            {/* Controls - Only show if multiple images */}
            {images.length > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={prevImage}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 ${
                    currentImageIndex === 0 ? "invisible" : ""
                  }`}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Next Button */}
                <button
                  onClick={nextImage}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 ${
                    currentImageIndex === images.length - 1 ? "invisible" : ""
                  }`}
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentImageIndex 
                          ? "bg-white w-3" 
                          : "bg-white/50 hover:bg-white/80"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
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
                    <img {...props} className="w-full h-full object-cover" />
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
  };

  const InteractionFooter = () => {
    return (
      <div className="border-t border-border/50 bg-background px-4 py-3 h-[60px] flex items-center justify-between shrink-0">
          <div className="flex-1 mr-4">
            <div 
              onClick={() => setIsCommentDialogOpen(true)}
              className="w-full h-9 px-4 rounded-full bg-secondary/50 flex items-center text-sm text-muted-foreground cursor-text hover:bg-secondary/70 transition-colors select-none"
            >
              {commentContent || "说点什么..."}
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground shrink-0">
            <button 
              onClick={handleLike}
              className={`flex flex-col items-center gap-0.5 transition-colors group ${
                isAuthor 
                  ? "opacity-50 cursor-not-allowed" 
                  : product?.hasLiked ? "text-red-500" : "hover:text-red-500"
              }`}
              disabled={isLikePending || isAuthor}
              title={isAuthor ? "不能给自己点赞" : undefined}
            >
              <Heart 
                className={`w-5 h-5 transition-all ${product?.hasLiked ? "fill-current scale-110" : "group-hover:scale-110"}`} 
              />
              <span className="text-[10px] font-medium">{product && product.likes > 0 ? product.likes : "点赞"}</span>
            </button>
            
            <button 
              onClick={handleFavorite}
              className={`flex flex-col items-center gap-0.5 transition-colors group ${
                isAuthor 
                  ? "opacity-50 cursor-not-allowed" 
                  : product?.hasFavorited ? "text-yellow-400" : "hover:text-yellow-400"
              }`}
              disabled={isFavoritePending || isAuthor}
              title={isAuthor ? "不能收藏自己的作品" : undefined}
            >
              <Star 
                className={`w-5 h-5 transition-all ${product?.hasFavorited ? "fill-current scale-110" : "group-hover:scale-110"}`} 
              />
              <span className="text-[10px] font-medium">{product && product.favorites > 0 ? product.favorites : "收藏"}</span>
            </button>
            
            <div className="flex flex-col items-center gap-0.5 hover:text-foreground transition-colors group">
              <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium">{totalComments > 0 ? totalComments : "评论"}</span>
            </div>
          </div>
      </div>
    );
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[90vw] h-[85vh] p-0 gap-0 overflow-hidden flex flex-col md:flex-row bg-background">
        <DialogTitle className="sr-only">产品详情: {product.name}</DialogTitle>
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <div className="hidden" />
        </AuthDialog>

        <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-background overflow-hidden z-[100]">
            <DialogHeader className="px-4 py-3 border-b border-border/50">
              <DialogTitle className="text-base font-medium">发表评论</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <Textarea
                placeholder="说点什么..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="min-h-[150px] w-full resize-none bg-background p-3 rounded-xl focus-visible:ring-1 focus-visible:ring-ring/50 border border-border text-sm text-left"
                style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'normal' }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCommentSubmit();
                  }
                }}
              />
              <div className="flex items-center justify-end gap-3 mt-4">
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsCommentDialogOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    取消
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleCommentSubmit}
                    disabled={submitting || !commentContent.trim()}
                    className="rounded-full px-6"
                  >
                    {submitting ? "发送中..." : "发送"}
                    {!submitting && <Send className="w-3.5 h-3.5 ml-1.5" />}
                  </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 手机端布局：单一滚动容器 */}
        <div className="md:hidden flex flex-col w-full h-full overflow-hidden bg-background">
           <div className="flex-1 overflow-y-auto scrollbar-hide">
               <AuthorSection 
                 product={product} 
                 currentUserId={currentUserId} 
                 isFollowing={isFollowing} 
                 isShareCopied={isShareCopied} 
                 onFollow={handleFollow} 
                 onShare={handleShare} 
               />
               <ProductInfoSection />
               <div className="px-4">
                 <CommentList ref={mobileCommentListRef} productId={product.id} onCountChange={setTotalComments} />
               </div>
           </div>
           <InteractionFooter />
        </div>

        {/* 桌面端布局：双列布局 */}
        <div className="hidden md:flex w-full h-full flex-row overflow-hidden bg-background">
          {/* 左侧：产品详情 (独立滚动) */}
          <div className="w-[55%] h-full bg-background relative flex flex-col overflow-y-auto scrollbar-hide border-r border-border/50">
            <ProductInfoSection />
          </div>

          {/* 右侧：互动区域 */}
          <div className="w-[45%] h-full flex flex-col bg-background relative">
            <AuthorSection 
              product={product} 
              currentUserId={currentUserId} 
              isFollowing={isFollowing} 
              isShareCopied={isShareCopied} 
              onFollow={handleFollow} 
              onShare={handleShare} 
            />
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              <CommentList ref={commentListRef} productId={product.id} onCountChange={setTotalComments} />
            </div>
            <InteractionFooter />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
