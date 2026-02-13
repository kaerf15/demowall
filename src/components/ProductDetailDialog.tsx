"use client";

import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { CommentList, CommentListRef } from "@/components/CommentList";
import { Heart, Star, MessageCircle, Send } from "lucide-react";
import { AuthDialog } from "@/components/AuthDialog";
import { Textarea } from "@/components/ui/textarea";
import { Product } from "@/types";
import { AuthorSection } from "@/components/product/AuthorSection";
import { ProductInfoSection } from "@/components/product/ProductInfoSection";
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

  useEffect(() => {
    if (product) {
      checkFollowStatus();
    }
  }, [product, user]);

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
               <ProductInfoSection product={product} />
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
            <ProductInfoSection product={product} />
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
