"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ProductForm, ProductFormData } from "./ProductForm";

interface Category {
  id: string;
  name: string;
  slug: string;
  type?: string;
}

interface SubmitFormProps {
  categories: Category[];
}

export function SubmitForm({ categories }: SubmitFormProps) {
  const router = useRouter();
  const { token, logout } = useAuth();

  const handleSubmit = async (data: ProductFormData) => {
    try {
      if (!token) {
        toast.error("请先登录");
        return;
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("发布成功");
        router.push("/");
      } else {
        if (response.status === 401) {
            // Token 过期或无效
            logout();
            toast.error("登录已过期，请重新登录");
            return;
        }
        const resData = await response.json();
        if (response.status === 409) {
            toast.error("您已发布过同名产品，请修改产品名称");
        } else {
            toast.error(resData.error || "发布失败，请重试");
        }
      }
    } catch (error) {
      console.error("提交错误:", error);
      toast.error("提交失败，请重试");
    }
  };

  return (
    <ProductForm
      categories={categories}
      onSubmit={handleSubmit}
      title="发布你的产品"
      description="分享你的创意作品，让更多人发现它"
      submitLabel="发布产品"
    />
  );
}