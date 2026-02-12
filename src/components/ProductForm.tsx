"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  type?: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  detail: string;
  websiteUrl: string;
  githubUrl?: string;
  categoryIds: string[];
  images: string[];
}

interface ProductFormProps {
  categories: Category[];
  initialData?: ProductFormData;
  onSubmit: (data: ProductFormData) => Promise<void>;
  submitLabel?: string;
  title: string;
  description?: string;
}

export function ProductForm({ 
  categories, 
  initialData = {
    name: "",
    description: "",
    detail: "",
    websiteUrl: "",
    githubUrl: "",
    categoryIds: [],
    images: [],
  },
  onSubmit,
  submitLabel = "发布",
  title,
  description
}: ProductFormProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialData);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formData.images.length + files.length > 5) {
      toast.error("最多只能上传5张图片");
      return;
    }

    setIsUploading(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`图片 ${file.name} 超过 5MB 限制`);
          continue;
        }

        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("type", "cover");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (res.ok) {
          const data = await res.json();
          newImages.push(data.url);
        } else {
          console.error("Upload failed for", file.name);
          try {
            const errorData = await res.json();
            console.error("Upload error details:", errorData);
          } catch (e) {
            console.error("Failed to parse error response");
          }
        }
      }

      if (newImages.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
      } else {
        toast.error("所有图片上传失败，请重试");
      }
    } catch (error) {
      console.error("Upload error", error);
      toast.error("上传出错，请重试");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => {
      const current = prev.categoryIds;
      if (current.includes(categoryId)) {
        return { ...prev, categoryIds: current.filter(id => id !== categoryId) };
      } else {
        if (current.length >= 3) {
          return prev; // Max 3
        }
        return { ...prev, categoryIds: [...current, categoryId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.categoryIds.length === 0) {
      toast.error("请至少选择一个分类");
      return;
    }
    if (formData.categoryIds.length > 3) {
      toast.error("最多只能选择3个分类");
      return;
    }
    if (formData.images.length === 0) {
      toast.error("请至少上传一张图片");
      return;
    }

    // Client-side validation for required fields (fallback for browser validation)
    if (!formData.name.trim()) {
       toast.error("请输入产品名称");
       return;
    }
    if (!formData.description.trim()) {
       toast.error("请输入产品描述");
       return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border border-border/50 shadow-xl shadow-primary/5">
      <CardHeader className="pb-6 relative">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-center">
          {title}
        </CardTitle>
        {description && (
          <p className="text-muted-foreground mt-2 text-center">
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">产品名称 *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="例如: InspireDrop"
              className="bg-secondary/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">产品描述 *</label>
            <Textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="一句话介绍你的产品解决了什么问题"
              className="bg-secondary/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/30 min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">产品图片 * (1-5张，每张不超过5MB)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
              {formData.images.map((url, index) => (
                <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-border group">
                  <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                  {index === 0 && (
                    <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-br">
                      封面
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              
              {formData.images.length < 5 && (
                <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer bg-secondary/10 hover:bg-secondary/30 transition-colors">
                  {isUploading ? (
                    <svg className="animate-spin h-6 w-6 text-muted-foreground" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs text-muted-foreground">上传图片</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">详细说明</label>
            <div className="relative">
              <Textarea
                value={formData.detail}
                onChange={(e) =>
                  setFormData({ ...formData, detail: e.target.value })
                }
                placeholder="支持 Markdown 格式，详细介绍产品功能、特点..."
                className="bg-secondary/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/30 min-h-[200px] font-mono text-sm"
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                Markdown
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">产品链接 (可选)</label>
              <Input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) =>
                  setFormData({ ...formData, websiteUrl: e.target.value })
                }
                placeholder="https://example.com"
                className="bg-secondary/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">分类 * (1-3个)</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={formData.categoryIds.includes(category.id) ? "default" : "outline"}
                  className={`cursor-pointer px-3 py-1.5 transition-all ${
                    formData.categoryIds.includes(category.id)
                      ? "hover:bg-primary/90"
                      : "hover:bg-secondary hover:text-secondary-foreground"
                  }`}
                  onClick={() => toggleCategory(category.id)}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  提交中...
                </div>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
