"use client";

import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { AuthDialog } from "@/components/AuthDialog";
import { Heart, Send, Trash2 } from "lucide-react";
import jwt from "jsonwebtoken";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  username: string;
  avatar: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User | null;
  guestName: string | null;
  guestAvatar: string | null;
  parentId: string | null;
  replies?: Comment[];
  likes: number;
  hasLiked: boolean;
  replyToUser?: User | null;
  rootId?: string | null;
}

interface CommentListProps {
  productId: string;
  onCountChange?: (count: number) => void;
}

export interface CommentListRef {
  refresh: () => void;
}

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  onReply: (commentId: string) => void;
  replyTo: string | null;
  replyContent: string;
  onReplyContentChange: (content: string) => void;
  onSubmitReply: (parentId: string) => void;
  submitting: boolean;
  onLike: (commentId: string, hasLiked: boolean) => void;
  onDelete: (commentId: string) => void;
  currentUserId: string | null;
}

const CommentItem = ({ 
  comment, 
  isReply = false,
  onReply,
  replyTo,
  replyContent,
  onReplyContentChange,
  onSubmitReply,
  submitting,
  onLike,
  onDelete,
  currentUserId
}: CommentItemProps) => {
  const avatarRaw = comment.user?.avatar || comment.guestAvatar;
  // 兼容旧数据：如果头像是 placeholder-avatar.png，则视为无头像
  const avatarSrc = (avatarRaw && avatarRaw !== "/placeholder-avatar.png") ? avatarRaw : null;
  
  const username = comment.user?.username || comment.guestName || "匿名用户";

  const isSelfReply = comment.replyToUser && currentUserId === comment.replyToUser.id;
  
  // Calculate profile link
  const profileLink = comment.user 
    ? (currentUserId && String(comment.user.id) === String(currentUserId) ? "/profile" : `/users/${comment.user.id}`)
    : null;

  const [isExpanded, setIsExpanded] = useState(false);
  const replies = comment.replies || [];
  const shouldCollapse = !isExpanded && replies.length > 1;
  const visibleReplies = shouldCollapse ? replies.slice(replies.length - 1) : replies;
  const hiddenCount = replies.length - 1;

  return (
    <div className={`flex gap-3 ${isReply ? "mt-3" : "mt-6 first:mt-0"}`}>
      <div className="flex-shrink-0">
        {profileLink ? (
          <Link href={profileLink} className="block hover:opacity-80 transition-opacity">
            <Avatar
              src={avatarSrc || undefined}
              fallback={username}
              className="w-8 h-8 border border-border/50"
            />
          </Link>
        ) : (
          <Avatar
            src={avatarSrc || undefined}
            fallback={username}
            className="w-8 h-8 border border-border/50"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {profileLink ? (
            <Link href={profileLink} className="font-semibold text-sm text-foreground/90 truncate hover:text-primary transition-colors hover:underline">
              {username}
            </Link>
          ) : (
            <span className="font-semibold text-sm text-foreground/90 truncate">{username}</span>
          )}
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
              locale: zhCN,
            })}
          </span>
        </div>
        <p className="text-sm text-foreground/80 mb-2 leading-relaxed">
          {comment.replyToUser && !isSelfReply && (
            <span className="text-muted-foreground mr-1">
              回复 <span className="font-medium text-foreground/90">@{comment.replyToUser.username || "匿名用户"}</span>:
            </span>
          )}
          {comment.content}
        </p>
        
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={() => onReply(replyTo === comment.id ? "" : comment.id)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium flex items-center gap-1"
          >
            回复
          </button>

          <button 
            onClick={() => onLike(comment.id, comment.hasLiked)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors group"
          >
            <Heart className={`w-3.5 h-3.5 ${comment.hasLiked ? "fill-destructive text-destructive" : "group-hover:text-destructive"}`} />
            <span>{comment.likes > 0 ? comment.likes : "赞"}</span>
          </button>

          {currentUserId && comment.user && String(comment.user.id) === String(currentUserId) && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              删除
            </button>
          )}
        </div>

        {/* 回复输入框 */}
        {replyTo === comment.id && (
          <div className="mt-3 flex gap-2 animate-fadeIn w-full relative max-w-full">
            <Textarea
              value={replyContent}
              onChange={(e) => onReplyContentChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmitReply(comment.id);
                }
              }}
              placeholder={`回复 ${username}...`}
              className="min-h-[36px] w-full text-sm bg-secondary/30 resize-none focus-visible:ring-1 focus-visible:ring-ring/50 rounded-2xl py-2 px-3 overflow-hidden outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            {replyContent.trim() && (
              <button 
                onClick={() => onSubmitReply(comment.id)}
                disabled={submitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary p-1 hover:scale-110 transition-transform"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* 显示回复列表 */}
        {visibleReplies.map(reply => (
          <CommentItem 
            key={reply.id} 
            comment={reply} 
            isReply={true}
            onReply={onReply}
            replyTo={replyTo}
            replyContent={replyContent}
            onReplyContentChange={onReplyContentChange}
            onSubmitReply={onSubmitReply}
            submitting={submitting}
            onLike={onLike}
            onDelete={onDelete}
            currentUserId={currentUserId}
          />
        ))}

        {/* 展开/折叠按钮 */}
        {shouldCollapse && (
          <div className="mt-3 flex items-center gap-4">
            <button 
              onClick={() => setIsExpanded(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
            >
              <div className="w-8 h-[1px] bg-border group-hover:bg-foreground/50 transition-colors"></div>
              <span>展开 {hiddenCount} 条回复</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const CommentList = forwardRef<CommentListRef, CommentListProps>(({ productId, onCountChange }, ref) => {
  const { user, token, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  
  const currentUserId = user?.id || null;

  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const count = comments.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0);
    onCountChange?.(count);
  }, [comments, onCountChange]);

  const fetchComments = async () => {
    try {
      if (isMountedRef.current) setLoading(true);
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      
      const res = await fetch(`/api/products/${productId}/comments`, { headers });
      if (res.ok && isMountedRef.current) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("加载评论失败", error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchComments
  }));

  useEffect(() => {
    fetchComments();
  }, [productId, user]);

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    if (!isAuthenticated || !token) {
      setShowAuthDialog(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: replyContent,
          parentId,
        }),
      });

      if (res.ok) {
        const newComment = await res.json();
        // 确保新评论有默认的点赞数据
        const commentWithLikes = { ...newComment, likes: 0, hasLiked: false };
        
        setComments(prev => 
          prev.map(c => {
            // 找到所属的根评论
            // 如果是直接回复根评论，parentId 就是根评论 id
            // 如果是回复子评论，newComment.rootId 应该是根评论 id
            const targetRootId = commentWithLikes.rootId || commentWithLikes.parentId;
            
            if (c.id === targetRootId) {
              return {
                ...c,
                replies: [...(c.replies || []), commentWithLikes]
              };
            }
            return c;
          })
        );
        setReplyTo(null);
        setReplyContent("");
      } else {
        const error = await res.json();
        if (res.status === 401) {
          toast.error("请先登录");
        } else {
          toast.error(error.error || "回复失败");
        }
      }
    } catch (error) {
      console.error("回复错误", error);
      toast.error("回复失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, currentHasLiked: boolean) => {
    if (!isAuthenticated || !token) {
      setShowAuthDialog(true);
      return;
    }

    // 乐观更新
    setComments(prev => {
      const updateComment = (c: Comment): Comment => {
        if (c.id === commentId) {
          return {
            ...c,
            likes: currentHasLiked ? c.likes - 1 : c.likes + 1,
            hasLiked: !currentHasLiked
          };
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map(updateComment)
          };
        }
        return c;
      };
      return prev.map(updateComment);
    });

    try {
      const method = currentHasLiked ? "DELETE" : "POST";
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        // 失败回滚
        setComments(prev => {
          const updateComment = (c: Comment): Comment => {
            if (c.id === commentId) {
              return {
                ...c,
                likes: currentHasLiked ? c.likes + 1 : c.likes - 1,
                hasLiked: currentHasLiked
              };
            }
            if (c.replies) {
              return {
                ...c,
                replies: c.replies.map(updateComment)
              };
            }
            return c;
          };
          return prev.map(updateComment);
        });
      }
    } catch (error) {
      console.error("点赞操作失败", error);
    }
  };

  const handleReplyToggle = (commentId: string) => {
    setReplyTo(replyTo === commentId ? null : commentId);
  };

  const handleReplyContentChange = (content: string) => {
    setReplyContent(content);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete || !token) return;

    try {
      const res = await fetch(`/api/comments/${commentToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("删除成功");
        setComments(prev => {
          const newComments = prev.filter(c => c.id !== commentToDelete).map(c => ({
            ...c,
            replies: c.replies ? c.replies.filter(r => r.id !== commentToDelete) : c.replies
          }));
          
          return newComments;
        });
      } else {
        const error = await res.json();
        toast.error(error.error || "删除失败");
      }
    } catch (error) {
      console.error("删除评论失败", error);
      toast.error("删除失败，请重试");
    } finally {
      setCommentToDelete(null);
    }
  };

  return (
    <>
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <div className="hidden" />
      </AuthDialog>

      <AlertDialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除评论？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，确定要删除这条评论吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteComment} className="bg-destructive hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="py-4">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          共 {comments.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0)} 条评论
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/20 border-t-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl border border-border/50">
            <p className="text-sm">暂无评论，快来抢沙发吧！</p>
          </div>
        ) : (
          <div className="space-y-2 pb-20">
            {comments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment}
                onReply={handleReplyToggle}
                replyTo={replyTo}
                replyContent={replyContent}
                onReplyContentChange={handleReplyContentChange}
                onSubmitReply={handleSubmitReply}
                submitting={submitting}
                onLike={handleLikeComment}
                onDelete={setCommentToDelete}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
});

CommentList.displayName = "CommentList";
