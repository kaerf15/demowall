
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
import { Avatar } from "@/components/ui/avatar";
import { Search, Trash2, Heart, Star, Users, UserPlus, Package, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

async function fetchUsers({ page = 1, query = "" }) {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams({ page: page.toString(), limit: "10", q: query });
  const res = await fetch(`/api/admin/users?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", page, debouncedSearch],
    queryFn: async () => {
      const result = await fetchUsers({ page, query: debouncedSearch });
      console.log("Admin Users Data:", result);
      return result;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("用户已删除");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setUserToDelete(null);
    },
    onError: () => {
      toast.error("删除失败");
    },
  });

  const handleDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索用户名或邮箱..."
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
              <TableHead>用户</TableHead>
              <TableHead>注册日期</TableHead>
              <TableHead>最近登录</TableHead>
              <TableHead className="text-center">发布作品</TableHead>
              <TableHead className="text-center">关注/粉丝</TableHead>
              <TableHead className="text-center">获赞/收藏</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  加载中...
                </TableCell>
              </TableRow>
            ) : data?.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  暂无用户
                </TableCell>
              </TableRow>
            ) : (
              data?.items?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        title="查看主页"
                        onClick={() => window.open(`/users/${user.id}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90"
                        onClick={() => setUserToDelete(user)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar 
                        src={user.avatar} 
                        fallback={user.username ? user.username.slice(0, 2).toUpperCase() : "??"} 
                        className="w-10 h-10"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{user.username}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt ? format(new Date(user.lastLoginAt), "yyyy-MM-dd HH:mm") : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span>{user.stats.products}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center gap-1 text-sm">
                      <div className="flex items-center gap-1" title="关注数">
                        <UserPlus className="w-3 h-3 text-muted-foreground" />
                        <span>{user.stats.following}</span>
                      </div>
                      <div className="flex items-center gap-1" title="粉丝数">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span>{user.stats.followers}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center gap-1 text-sm">
                      <div className="flex items-center gap-1" title="获赞数">
                        <Heart className="w-3 h-3 text-rose-500" />
                        <span>{user.stats.likesReceived}</span>
                      </div>
                      <div className="flex items-center gap-1" title="获收藏数">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>{user.stats.favoritesReceived}</span>
                      </div>
                    </div>
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

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。这将永久删除用户 <strong>{userToDelete?.username}</strong> 及其所有发布的作品、评论和交互数据。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
