"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ProductForm, ProductFormData } from "@/components/ProductForm";
import { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { FluidLogo } from "@/components/FluidLogo";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  
  const router = useRouter();
  const { token, user, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<ProductFormData | null>(null);

  useEffect(() => {
    // 1. Fetch categories
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(console.error);

    // 2. Fetch product data
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
          const product = await res.json();
          
          // Verify ownership
          if (isAuthenticated && user && product.userId !== user.id) {
            toast.error("你没有权限编辑此产品");
            router.push("/");
            return;
          }

          // Parse images
          let images: string[] = [];
          if (product.images) {
            try {
              const parsed = JSON.parse(product.images as string);
              if (Array.isArray(parsed)) images = parsed;
            } catch (e) {
              console.error("Failed to parse product images", e);
            }
          } else if (product.imageUrl) {
            images = [product.imageUrl];
          }

          setInitialData({
            name: product.name,
            description: product.description,
            detail: product.detail || "",
            websiteUrl: product.websiteUrl,
            githubUrl: product.githubUrl || "",
            categoryIds: product.categories?.map((c: any) => c.id) || [],
            images: images,
          });
        } else {
          toast.error("产品不存在");
          router.push("/");
        }
      } catch (e) {
        console.error("Failed to fetch product", e);
        toast.error("加载失败");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated !== undefined) {
       fetchProduct();
    }
  }, [productId, isAuthenticated, user, router]);

  const handleSubmit = async (data: ProductFormData) => {
    try {
      if (!token) {
        toast.error("请先登录");
        return;
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (response.ok) {
        toast.success("修改成功");
        router.push("/profile");
      } else {
        toast.error(resData.error || "更新失败");
      }
    } catch (error) {
      console.error("更新失败:", error);
      toast.error("更新失败，请重试");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          加载中...
        </div>
      </div>
    );
  }

  if (!initialData) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Floating Back Button */}
      <Button 
        variant="outline"
        className="fixed left-4 sm:left-8 top-24 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 group h-auto"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">返回上一页</span>
      </Button>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <ProductForm
            categories={categories}
            initialData={initialData}
            onSubmit={handleSubmit}
            title="编辑产品"
            submitLabel="保存修改"
          />
        </div>
      </main>

      <footer className="bg-card border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">D</span>
              </div>
              <FluidLogo />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 DemoWall. 独立开发者产品交流社区
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
