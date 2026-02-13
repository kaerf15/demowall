
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, ExternalLink, Heart, Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Avatar } from "@/components/ui/avatar";

async function fetchProducts({ page = 1, query = "" }) {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams({ page: page.toString(), limit: "10", q: query });
  const res = await fetch(`/api/admin/products?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", page, debouncedSearch],
    queryFn: () => fetchProducts({ page, query: debouncedSearch }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("产品已删除");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      setProductToDelete(null);
    },
    onError: () => {
      toast.error("删除失败");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索产品名称或描述..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">操作</TableHead>
              <TableHead className="w-[300px]">产品信息</TableHead>
              <TableHead>作者</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-center">互动数据</TableHead>
              <TableHead>发布日期</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 h-24">
                  加载中...
                </TableCell>
              </TableRow>
            ) : data?.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground h-24">
                  暂无产品
                </TableCell>
              </TableRow>
            ) : (
              data?.items?.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="查看详情"
                        onClick={() => window.open(`/?product=${product.id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={() => setProductToDelete(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 font-medium">
                        {product.imageUrl && (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="h-8 w-8 rounded object-cover border"
                          />
                        )}
                        <span className="truncate max-w-[200px]" title={product.name}>{product.name}</span>
                      </div>
                      {product.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[280px]" title={product.description}>
                          {product.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar 
                        className="w-6 h-6" 
                        src={product.author?.avatar} 
                        fallback={product.author?.username?.slice(0, 1).toUpperCase()} 
                      />
                      <span className="text-sm">{product.author?.username || "Unknown"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.status === "PUBLISHED" ? "default" : "secondary"}>
                      {product.status === "PUBLISHED" ? "已发布" : "草稿"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1" title="点赞数">
                        <Heart className="w-3 h-3 text-rose-500" /> {product.stats.likes}
                      </div>
                      <div className="flex items-center gap-1" title="收藏数">
                        <Star className="w-3 h-3 text-yellow-500" /> {product.stats.favorites}
                      </div>
                      <div className="flex items-center gap-1" title="评论数">
                        <MessageSquare className="w-3 h-3 text-blue-500" /> {product.stats.comments}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(product.createdAt), "yyyy-MM-dd")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || isLoading}
        >
          上一页
        </Button>
        <span className="text-sm text-muted-foreground">
          第 {page} 页 / 共 {data?.totalPages || 1} 页
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.min(data?.totalPages || 1, p + 1))}
          disabled={page >= (data?.totalPages || 1) || isLoading}
        >
          下一页
        </Button>
      </div>

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除产品？</AlertDialogTitle>
            <AlertDialogDescription>
              即将删除产品 <strong>{productToDelete?.name}</strong>。
              <br/>
              此操作不可逆！将永久删除该产品的所有内容、图片及相关评论数据。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => productToDelete && deleteMutation.mutate(productToDelete.id)}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
