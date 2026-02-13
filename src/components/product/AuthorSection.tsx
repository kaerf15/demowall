import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Share2 } from "lucide-react";
import Link from "next/link";

interface AuthorSectionProps {
  product: Product;
  currentUserId: string | null;
  isFollowing: boolean;
  isShareCopied: boolean;
  onFollow: () => void;
  onShare: () => void;
  className?: string;
}

export function AuthorSection({
  product,
  currentUserId,
  isFollowing,
  isShareCopied,
  onFollow,
  onShare,
  className = "",
}: AuthorSectionProps) {
  const profileLink = currentUserId && String(currentUserId) === String(product.userId) ? "/profile" : `/users/${product.userId}`;

  return (
    <div className={`flex flex-col p-4 border-b border-border/50 gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Link href={profileLink} className="flex items-center gap-3 hover:opacity-80 transition-opacity" prefetch={false}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden">
            {product.user?.avatar ? (
              <img src={product.user.avatar} alt={product.user.username || "User"} className="w-full h-full object-cover" />
            ) : (
              (product.user?.username || "U").charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col">
            <div className="font-semibold text-sm">{product.user?.username || "Unknown"}</div>
            {product.user?.title && (
              <Badge
                variant="secondary"
                className="mt-1 w-fit bg-secondary/70 text-secondary-foreground border-0 text-[10px] px-2 py-0.5 rounded-full"
              >
                {product.user.title}
              </Badge>
            )}
          </div>
        </Link>
      </div>
      
      <div className="flex items-center gap-3">
        {product.userId !== currentUserId ? (
          <Button 
            variant="outline" 
            size="sm" 
            className={`flex-1 h-7 px-4 text-xs font-medium rounded-full border-border/40 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 ${
              isFollowing 
                ? "text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border-red-200" 
                : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
            }`}
            onClick={onFollow}
          >
            {isFollowing ? (
              "已关注"
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                关注
              </>
            )}
          </Button>
        ) : null}
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 h-7 px-4 text-xs font-medium rounded-full text-muted-foreground border-border/40 hover:bg-secondary/30 hover:text-foreground transition-colors focus-visible:ring-0 focus-visible:ring-offset-0" 
          onClick={onShare}
        >
          {isShareCopied ? (
            <div className="flex items-center text-green-500">
              <div className="w-3.5 h-3.5 mr-1.5 flex items-center justify-center rounded-full bg-green-500">
                 <span className="text-white text-[10px] font-bold">✓</span>
              </div>
              已复制
            </div>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              分享
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
