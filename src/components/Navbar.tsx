"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthDialog } from "@/components/AuthDialog";
import { FluidLogo } from "@/components/FluidLogo";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

import { LayoutDashboard } from "lucide-react";

export function Navbar({ onSearch, searchQuery = "" }: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [placeholder, setPlaceholder] = useState("发现/分享你的产品");

  useEffect(() => {
    // 轮播 placeholder 文本
    const texts = ["发现/分享你的产品", "找到志同道合的朋友"];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % texts.length;
      setPlaceholder(texts[index]);
    }, 5000); // 每5秒切换一次

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-2 sm:gap-6">
          {/* ... existing Logo and Search */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0 relative z-10">
            <FluidLogo />
          </Link>

          <div className="flex-1 min-w-0 relative z-0">
            <div className="relative group">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Input
                type="text"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => onSearch?.(e.target.value)}
                className="pl-10 w-full bg-secondary/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/30 rounded-xl transition-all duration-300 max-sm:text-[10px] max-sm:placeholder:text-[10px] max-sm:h-8"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 relative z-10">
            {user ? (
               <Link href="/submit">
                <Button size="icon" variant="ghost" className="rounded-full" title="提交产品">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Button>
              </Link>
            ) : (
              <AuthDialog>
                <Button size="icon" variant="ghost" className="rounded-full" title="提交产品">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Button>
              </AuthDialog>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all focus:outline-none max-xs:hidden">
                    <Avatar 
                      src={user.avatar} 
                      fallback={user.username} 
                      className="w-full h-full" 
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      个人中心
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "ADMIN" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        管理后台
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="max-xs:hidden">
                <AuthDialog>
                  <Button size="icon" variant="ghost" className="rounded-full" title="登录/注册">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Button>
                </AuthDialog>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
