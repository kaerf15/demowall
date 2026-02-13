
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const sidebarItems = [
  {
    title: "概览",
    href: "/admin",
  },
  {
    title: "用户",
    href: "/admin/users",
  },
  {
    title: "产品",
    href: "/admin/products",
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="flex h-full w-full flex-col bg-card text-card-foreground">
      <div className="flex h-14 items-center justify-center border-b font-semibold">
        后台
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {sidebarItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              title={item.title}
              prefetch={false}
              className={cn(
                "flex items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t p-2">
        <Button 
          variant="ghost" 
          size="sm"
          className="w-full justify-center text-sm font-medium"
          onClick={logout}
          title="退出登录"
        >
          退出
        </Button>
      </div>
    </div>
  );
}
