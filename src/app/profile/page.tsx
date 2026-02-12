"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailDialog } from "@/components/ProductDetailDialog";
// import { ProductEditDialog } from "@/components/ProductEditDialog"; // Removed
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { Edit2, Link as LinkIcon, Check, Trash2 } from "lucide-react";
import { Product, Category } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  username: string;
  email: string | null;
  avatar?: string;
  contact?: string;
  bio?: string;
  title?: string;
}

import { FollowListDialog } from "@/components/FollowListDialog";
import { StatsDetailDialog } from "@/components/StatsDetailDialog";

import { Navbar } from "@/components/Navbar";

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, token, isAuthenticated, updateUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("created");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    contact: ["", "", "", ""],
    bio: "",
    title: "",
  });

  // Delete product state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    followingCount: 0,
    followersCount: 0,
    likesCount: 0,
    favoritesCount: 0,
    totalLikesAndFavorites: 0,
    publishedProductsCount: 0,
    viewsCount: 0,
  });
  const [showFollowDialog, setShowFollowDialog] = useState(false);
  const [followDialogTab, setFollowDialogTab] = useState<"following" | "followers">("following");
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null); // Kept for type safety but unused now
  
  const [categories, setCategories] = useState<Category[]>([]);

  // 1. Check auth
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated || !token) {
        setLoading(false);
        // router.push("/"); // AuthContext will handle redirect if needed, or we can do it here
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          const contacts = (data.user.contact || "").split('\n');
          setEditForm({
            username: data.user.username,
            contact: [
              contacts[0] || "",
              contacts[1] || "",
              contacts[2] || "",
              contacts[3] || ""
            ],
            bio: data.user.bio || "",
            title: data.user.title || "",
          });
        } else {
          router.push("/");
        }
      } catch (e) {
        console.error(e);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [isAuthenticated, token, router]);

  // 2. Fetch categories and stats
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(console.error);

    if (user && token) {
      fetch("/api/user/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.stats) {
            setStats(data.stats);
          }
        })
        .catch(console.error);
    }
  }, [user?.id, token]);

  // 3. Fetch products based on tab
  useEffect(() => {
    if (!user || !token) return;
    
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        let url = `/api/products?type=${activeTab}`;
        if (activeTab === "drafts") {
          url = `/api/products?type=created&status=DRAFT`;
        } else if (activeTab === "created") {
           // Explicitly ask for PUBLISHED to be safe, though default is PUBLISHED
           url = `/api/products?type=created&status=PUBLISHED`;
        }

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];
          setProducts(Array.isArray(items) ? items : []);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [activeTab, user?.id, token]);

  const handleEditProduct = (product: Product) => {
    router.push(`/products/${product.id}/edit`);
  };

  // Handle profile updates (username/contact/bio/title)
  const updateProfile = async (field: 'username' | 'contact' | 'bio' | 'title', value: string) => {
    if (!user) return;
    
    // Don't update if value hasn't changed
    if (user[field] === value) {
      if (field === 'username') setIsEditingUsername(false);
      return;
    }

    try {
      if (!token) {
        toast.error("请先登录");
        return;
      }

      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...user,
          [field]: value,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        handleProfileUpdate(data.user, field === 'contact');
      } else {
        console.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      if (field === 'username') setIsEditingUsername(false);
      // Removed isEditingContact logic
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete || !user) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("删除成功");
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
        setStats((prev) => ({
          ...prev,
          publishedProductsCount: Math.max(0, prev.publishedProductsCount - 1),
        }));
      } else {
        const data = await res.json();
        toast.error(data.error || "删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败，请重试");
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("请上传图片文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片大小不能超过 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "avatar");

    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      
      if (uploadRes.ok) {
        // Update user profile with new avatar URL
        const token = localStorage.getItem("token");
        const res = await fetch("/api/auth/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...user,
            avatar: uploadData.url,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          handleProfileUpdate(data.user);
          toast.success("头像更新成功");
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || "更新头像失败");
        }
      } else {
        toast.error("上传失败: " + uploadData.error);
      }
    } catch (error) {
      console.error("Upload error", error);
      toast.error("上传出错，请重试");
    } finally {
      e.target.value = "";
    }
  };

  const handleProfileUpdate = (updatedUser: any, skipContactFormUpdate = false) => {
    setUser(updatedUser);
    const contacts = (updatedUser.contact || "").split('\n');
    setEditForm(prev => ({
      username: updatedUser.username,
      contact: skipContactFormUpdate ? prev.contact : [
        contacts[0] || "",
        contacts[1] || "",
        contacts[2] || "",
        contacts[3] || ""
      ],
      bio: updatedUser.bio || "",
      title: updatedUser.title || "",
    }));
    // Update auth context
    updateUser(updatedUser);
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 max-w-6xl py-10">
        {/* Profile Header & Bio Section */}
        <div className="flex gap-8 items-stretch mb-8">
          {/* Left Column: Avatar & Bio */}
          <div className="w-24 shrink-0 flex flex-col gap-4">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden cursor-pointer relative group/profile shadow-xl border-4 border-background ring-2 ring-transparent hover:ring-primary/20 transition-all duration-300">
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
              <Avatar 
                src={user.avatar} 
                fallback={user.username} 
                className="w-full h-full transition-transform duration-500 group-hover/profile:scale-105" 
              />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover/profile:opacity-100 flex items-center justify-center transition-all duration-300 pointer-events-none">
                <Edit2 className="w-8 h-8 text-white drop-shadow-md" />
              </div>
            </div>

            {/* Bio */}
            <div className="flex-1 relative group w-full">
              <Textarea
                value={editForm.bio}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) {
                    setEditForm({ ...editForm, bio: e.target.value });
                  }
                }}
                placeholder="添加个人简介"
                className="h-full text-[10px] resize-none bg-secondary/30 border-border/50 hover:border-border focus:border-input focus:bg-background transition-all duration-200 scrollbar-hide px-2 py-1 leading-relaxed text-left rounded-md border"
                onBlur={() => updateProfile('bio', editForm.bio)}
              />
              <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                <Edit2 className="w-3 h-3 text-muted-foreground/50" />
              </div>
            </div>
          </div>

          {/* Right Column: Info, Stats & Contacts */}
          <div className="flex flex-col flex-1 pt-2">
            <div className="mb-2">
              {isEditingUsername ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="h-9 text-lg font-bold w-48"
                    autoFocus
                    maxLength={15}
                    onBlur={() => updateProfile('username', editForm.username)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') updateProfile('username', editForm.username);
                      if (e.key === 'Escape') {
                        setEditForm({ ...editForm, username: user.username });
                        setIsEditingUsername(false);
                      }
                    }}
                  />
                </div>
              ) : (
                <h1 
                  className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                  onClick={() => setIsEditingUsername(true)}
                >
                  {user.username}
                  <Edit2 className="w-4 h-4 opacity-0 group-hover/profile:opacity-50" />
                </h1>
              )}
            </div>
              
            <div className="relative group w-full max-w-lg mb-3">
              <Input
                value={editForm.title}
                onChange={(e) => {
                  if (e.target.value.length <= 20) {
                    setEditForm({ ...editForm, title: e.target.value });
                  }
                }}
                placeholder="添加个人标签 (20字内)"
                className="h-8 text-sm w-full bg-secondary/30 border-border/50 hover:border-border focus:border-input focus:bg-background transition-all duration-200"
                onBlur={() => updateProfile('title', editForm.title)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                <Edit2 className="w-3 h-3 text-muted-foreground/50" />
              </div>
            </div>
              
            {/* Stats Section */}
            <div className="grid grid-cols-3 items-center bg-secondary/30 px-6 py-2 rounded-2xl backdrop-blur-sm border border-border/50 divide-x divide-border/60 mb-3 w-full max-w-lg">
              <button 
                className="flex flex-col items-center group cursor-pointer"
                onClick={() => {
                  setFollowDialogTab("following");
                  setShowFollowDialog(true);
                }}
              >
                <span className="font-bold text-xl leading-none mb-1 group-hover:text-primary transition-colors">{stats.followingCount}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">关注</span>
              </button>
              <button 
                className="flex flex-col items-center group cursor-pointer"
                onClick={() => {
                  setFollowDialogTab("followers");
                  setShowFollowDialog(true);
                }}
              >
                <span className="font-bold text-xl leading-none mb-1 group-hover:text-primary transition-colors">{stats.followersCount}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">粉丝</span>
              </button>
              <button 
                className="flex flex-col items-center group cursor-pointer"
                onClick={() => setShowStatsDialog(true)}
              >
                <span className="font-bold text-xl leading-none mb-1 group-hover:text-primary transition-colors">{stats.totalLikesAndFavorites}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">获赞和收藏</span>
              </button>
            </div>

            {/* Contacts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg mt-auto">
              {editForm.contact.map((contact, index) => (
                <div 
                  key={index} 
                  className="group flex items-center h-9 w-full rounded-md border border-border/50 bg-secondary/30 transition-all duration-200 hover:border-border focus-within:border-input focus-within:bg-background"
                >
                  <button 
                    type="button"
                    className="flex h-full w-9 items-center justify-center text-muted-foreground/50 hover:text-primary/70 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    onClick={(e) => handleCopyContact(e, contact, index)}
                    title={contact ? "点击复制" : "暂无内容"}
                  >
                    {copiedIndex === index ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <LinkIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <input
                    value={contact}
                    onChange={(e) => {
                      const newContacts = [...editForm.contact];
                      newContacts[index] = e.target.value;
                      setEditForm(prev => ({ ...prev, contact: newContacts }));
                    }}
                    className="flex-1 h-full bg-transparent border-none outline-none text-sm px-2 w-full text-foreground placeholder:text-muted-foreground"
                    placeholder={`添加联系方式`}
                    onBlur={() => updateProfile('contact', editForm.contact.filter(Boolean).join('\n'))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="created">已发布</TabsTrigger>
            <TabsTrigger value="drafts">草稿箱</TabsTrigger>
            <TabsTrigger value="favorited">收藏</TabsTrigger>
            <TabsTrigger value="liked">点赞</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {productsLoading ? (
              <div className="text-center py-10">加载中...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground bg-secondary/20 rounded-xl">
                暂无数据
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                    action={
                      (activeTab === "created" || activeTab === "drafts") ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProduct(product);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductToDelete(product);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除？</AlertDialogTitle>
              <AlertDialogDescription>
                此操作无法撤销。这将永久删除您的产品 "{productToDelete?.name}" 以及所有相关的点赞、收藏和评论数据。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteProduct();
                }}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "删除中..." : "确认删除"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Detail Dialog */}
        {selectedProduct && (
          <ProductDetailDialog
            product={selectedProduct}
            open={!!selectedProduct}
            onOpenChange={(open) => {
              if (!open) setSelectedProduct(null);
            }}
          />
        )}

        {/* Edit Dialog */}
        {editingProduct && (
          <div className="hidden" /> // ProductEditDialog removed
        )}



        <FollowListDialog
          open={showFollowDialog}
          onOpenChange={setShowFollowDialog}
          initialTab={followDialogTab}
        />

        <StatsDetailDialog
          open={showStatsDialog}
          onOpenChange={setShowStatsDialog}
          stats={stats}
        />
      </div>
    </div>
  );
}
