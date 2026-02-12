"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import { AuthDialog } from "@/components/AuthDialog";

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
}

interface CommentSectionProps {
  productId: string;
}

export function CommentSection({ productId }: CommentSectionProps) {
  const { token, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [productId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("加载评论失败", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (parentId: string | null = null) => {
    if (!isAuthenticated || !token) {
      setShowAuthDialog(true);
      return;
    }

    const text = parentId ? replyContent : content;
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: text,
          parentId,
        }),
      });

      if (res.ok) {
        const newComment = await res.json();
        if (parentId) {
          // 更新回复列表
          setComments(prev => 
            prev.map(c => {
              if (c.id === parentId) {
                return {
                  ...c,
                  replies: [...(c.replies || []), newComment]
                };
              }
              return c;
            })
          );
          setReplyTo(null);
          setReplyContent("");
        } else {
          // 添加新主评论
          setComments(prev => [newComment, ...prev]);
          setContent("");
        }
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

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const avatar = comment.user?.avatar || comment.guestAvatar;
    const username = comment.user?.username || comment.guestName || "匿名用户";
    const initial = username.charAt(0).toUpperCase();

    return (
    <div className={`flex gap-3 ${isReply ? "ml-12 mt-4" : "mt-6"}`}>
      <div className="flex-shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={username}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
            {initial}
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">{username}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
              locale: zhCN,
            })}
          </span>
        </div>
        <p className="text-sm text-foreground/80 mb-2">{comment.content}</p>
        
        {!isReply && (
          <button
            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            回复
          </button>
        )}

        {/* 回复输入框 */}
        {replyTo === comment.id && (
          <div className="mt-3 flex gap-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`回复 ${username}...`}
              className="min-h-[60px] text-sm text-left"
            />
            <Button
              size="sm"
              onClick={() => handleSubmit(comment.id)}
              disabled={submitting}
              className="h-auto"
            >
              发表
            </Button>
          </div>
        )}

        {/* 显示回复列表 */}
        {comment.replies && comment.replies.map(reply => (
          <CommentItem key={reply.id} comment={reply} isReply={true} />
        ))}
      </div>
    </div>
  );
  };

  return (
    <div className="mt-8 pt-8 border-t border-border/50">
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <div className="hidden" />
      </AuthDialog>

      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        交流讨论
        <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
          {comments.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0)}
        </span>
      </h3>

      {/* 主评论输入框 */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的想法..."
            className="min-h-[80px] text-left"
          />
          <div className="flex justify-end mt-2">
            <Button
              onClick={() => handleSubmit(null)}
              disabled={submitting || !content.trim()}
            >
              发表评论
            </Button>
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">加载评论中...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-secondary/30 rounded-lg">
          暂无评论，快来抢沙发吧！
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
