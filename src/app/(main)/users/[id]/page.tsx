"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailDialog } from "@/components/ProductDetailDialog";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Product } from "@/types";
import { Link as LinkIcon, Check, Plus, Edit2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";

import { Navbar } from "@/components/Navbar";

interface User {
  id: string;
  username: string;
  email: string | null;
  avatar?: string;
  contact?: string;
  bio?: string;
  title?: string;
  createdAt?: string;
}

interface Stats {
    followingCount: number;
    followersCount: number;
    likesCount: number;
    favoritesCount: number;
    totalLikesAndFavorites: number;
    publishedProductsCount: number;
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const { user: currentUser, token, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    followingCount: 0,
    followersCount: 0,
    likesCount: 0,
    favoritesCount: 0,
    totalLikesAndFavorites: 0,
    publishedProductsCount: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("created");
  
  // 仅在非本人且 Auth 加载完成后才开始获取数据，避免重定向时的竞态条件
  // 注意：即使未登录 (currentUser 为 null)，只要 Auth 加载完成，也应该允许 fetch (查看他人主页)
  const isOwnProfile = currentUser?.id === userId;
  const shouldFetch = !authLoading && !isOwnProfile;

  const { data: productsData, isLoading: productsLoading } = useProducts({
    type: activeTab,
    userId: userId,
    enabled: shouldFetch,
  });

  const products = productsData ? productsData.pages.flatMap(page => page.items || []) : [];
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Fetch User & Stats
  useEffect(() => {
    // 如果 Auth 还在加载中，什么都不做，等待 settle
    if (authLoading) return;

    const fetchUser = async () => {
      try {
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        // 无论是否登录，都可以获取用户公开信息
        const res = await fetch(`/api/users/${userId}`, { headers });
        if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setStats(data.stats);
            setIsFollowing(data.isFollowing);
        } else {
            toast.error("用户不存在");
            router.push("/");
        }
      } catch (e) {
         console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, router, token, currentUser?.id, authLoading]);

  const handleFollow = async () => {
    if (!isAuthenticated || !token) {
        toast.error("请先登录");
        return;
    }
    
    try {
        const method = isFollowing ? "DELETE" : "POST";
        const res = await fetch(`/api/users/${userId}/follow`, {
            method,
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
            setIsFollowing(!isFollowing);
            setStats(prev => ({
                ...prev,
                followersCount: prev.followersCount + (isFollowing ? -1 : 1)
            }));
            // toast.success(isFollowing ? "已取消关注" : "已关注");
        } else {
            const data = await res.json();
            toast.error(data.error || "操作失败");
        }
    } catch (e) {
        toast.error("操作失败");
    }
  };

  const handleCopyContact = async (e: React.MouseEvent, text: string, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">加载中...</div>;
  if (!user) return null;

  const contacts = (user.contact || "").split('\n');
  const isSelf = currentUser?.id === user.id;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 max-w-6xl py-10">
        {/* Profile Header & Bio Section */}
        <div className="flex gap-8 items-stretch mb-8">
          {/* Left Column: Avatar & Bio */}
          <div className="w-24 shrink-0 flex flex-col gap-4">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden shadow-xl border-4 border-background ring-2 ring-transparent transition-all duration-300">
              <Avatar 
                className="w-full h-full text-2xl font-bold" 
                src={user.avatar} 
                fallback={user.username ? user.username.charAt(0).toUpperCase() : "U"} 
              />
            </div>

            {/* Bio */}
            {/* 保留布局，但如果没有内容则为空白 */}
            <div className="flex-1 w-full">
                {user.bio ? (
                  <div className="h-full text-[10px] bg-secondary/30 border border-border/50 px-2 py-1 leading-relaxed text-left rounded-md break-words whitespace-pre-wrap overflow-y-auto max-h-[200px] scrollbar-hide">
                    {user.bio}
                  </div>
                ) : (
                  <div className="h-full bg-secondary/10 border border-border/20 rounded-md"></div>
                )}
            </div>
          </div>

          {/* Right Column: Info, Stats & Contacts */}
          <div className="flex flex-col flex-1 pt-2">
            <div className="mb-2 flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {user.username}
                    </h1>
                </div>
                {isSelf ? (
                    <Button 
                        onClick={() => router.push("/profile")}
                        variant="outline"
                        size="sm"
                        className="gap-2 h-7 px-4 text-xs font-medium rounded-full border-border/40 text-muted-foreground hover:bg-secondary/30 hover:text-foreground transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        编辑资料
                    </Button>
                ) : (
                    <Button 
                        onClick={handleFollow}
                        variant="outline"
                        size="sm"
                        className={`gap-2 h-7 px-4 text-xs font-medium rounded-full border-border/40 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 ${
                            isFollowing 
                              ? "text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border-red-200" 
                              : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                          }`}
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
                )}
            </div>
              
            <div className="w-full max-w-lg mb-3">
                {user.title ? (
                    <div className="h-8 text-sm w-full bg-secondary/30 border border-border/50 rounded-md flex items-center px-3 text-muted-foreground">
                        {user.title}
                    </div>
                ) : (
                    // 保持高度占位，或者隐藏？用户说"没填的框内的提示不用显示出来"， imply 框还在？
                    // "隐藏空项的建议，不是隐藏，而是没填的框内的提示不用显示出来" -> 框还在，但没有 placeholder
                    <div className="h-8 w-full bg-secondary/10 border border-border/20 rounded-md"></div>
                )}
            </div>
              
            {/* Stats Section - Non-clickable */}
            <div className="grid grid-cols-3 items-center bg-secondary/30 px-6 py-2 rounded-2xl backdrop-blur-sm border border-border/50 divide-x divide-border/60 mb-3 w-full max-w-lg">
              <div className="flex flex-col items-center group cursor-default">
                <span className="font-bold text-xl leading-none mb-1">{stats.followingCount}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">关注</span>
              </div>
              <div className="flex flex-col items-center group cursor-default">
                <span className="font-bold text-xl leading-none mb-1">{stats.followersCount}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">粉丝</span>
              </div>
              <div className="flex flex-col items-center group cursor-default">
                <span className="font-bold text-xl leading-none mb-1">{stats.totalLikesAndFavorites}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">获赞与收藏</span>
              </div>
            </div>

            {/* Contact Grid */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {[0, 1, 2, 3].map((index) => {
                    const contact = contacts[index] || "";
                    if (!contact) {
                        return (
                             <div key={index} className="h-9 bg-secondary/10 border border-border/20 rounded-md"></div>
                        );
                    }
                    return (
                        <div key={index} className="relative group/input">
                            <div className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors items-center truncate">
                                {contact}
                            </div>
                            <button
                                onClick={(e) => handleCopyContact(e, contact, index)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors opacity-0 group-hover/input:opacity-100"
                                title="复制"
                            >
                                {copiedIndex === index ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                    <LinkIcon className="w-3 h-3" />
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="created" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="created">发布的作品</TabsTrigger>
            <TabsTrigger value="favorited">收藏的作品</TabsTrigger>
            <TabsTrigger value="liked">点赞的作品</TabsTrigger>
          </TabsList>
          
          <TabsContent value="created" className="mt-0">
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-[300px] bg-secondary/20 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                暂无发布的作品
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorited" className="mt-0">
             {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-[300px] bg-secondary/20 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                暂无收藏的作品
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked" className="mt-0">
             {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-[300px] bg-secondary/20 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                暂无点赞的作品
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ProductDetailDialog
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      />
    </div>
  );
}
