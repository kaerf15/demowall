import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: number;
  username: string;
  avatar: string | null;
}

interface FollowListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "following" | "followers";
}

export function FollowListDialog({
  open,
  onOpenChange,
  initialTab = "following",
}: FollowListDialogProps) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && token) {
      setActiveTab(initialTab);
      fetchUsers(initialTab);
    }
  }, [open, initialTab, token]);

  const fetchUsers = async (type: "following" | "followers") => {
    setLoading(true);
    try {
      if (!token) return;
      const res = await fetch(`/api/user/follows?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    const type = value as "following" | "followers";
    setActiveTab(type);
    fetchUsers(type);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] h-[500px] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-center">
            {activeTab === "following" ? "关注列表" : "粉丝列表"}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b bg-background p-0 h-12">
            <TabsTrigger 
              value="following" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none h-full transition-colors"
            >
              关注
            </TabsTrigger>
            <TabsTrigger 
              value="followers" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none h-full transition-colors"
            >
              粉丝
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">加载中...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">暂无数据</div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <Link 
                    href={`/users/${user.id}`} 
                    key={user.id} 
                    className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-lg transition-colors"
                    onClick={() => onOpenChange(false)}
                  >
                    <Avatar 
                      src={user.avatar} 
                      fallback={user.username || "U"} 
                      className="w-10 h-10" 
                    />
                    <span className="font-medium truncate flex-1">{user.username}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
