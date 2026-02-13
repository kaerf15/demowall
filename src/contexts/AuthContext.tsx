"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  [key: string]: any; // 允许其他字段
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 初始化检查
    const initializeAuth = () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (e) {
          console.error("Failed to parse user data", e);
          // Token 无效，自动清理
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          document.cookie = "token=; path=/; max-age=0; samesite=strict";
          setToken(null);
          setUser(null);
          // 可选：重定向到登录页
          // router.push("/login");
        }
      }
      setIsLoading(false);
    };

    // 验证 Token 有效性
    const verifyToken = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (!res.ok) {
            // Token 失效（如数据库重置导致用户不存在）
            logout();
          }
        } catch (e) {
          // 网络错误等忽略
        }
      }
    };

    initializeAuth();
    // 异步验证 token
    verifyToken();
  }, []);

  // 监听 storage 变化以支持多标签页同步
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "user") {
        const newToken = localStorage.getItem("token");
        const newUserStr = localStorage.getItem("user");
        
        if (newToken && newUserStr) {
           setToken(newToken);
           try {
             setUser(JSON.parse(newUserStr));
           } catch(e) {
             console.error("Failed to parse synced user data", e);
             setUser(null);
           }
        } else if (!newToken || !newUserStr) {
           // 如果其中一个没了，就都清空
           setToken(null);
           setUser(null);
        }
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    // Set cookie for middleware/server-side auth
    document.cookie = `token=${newToken}; path=/; max-age=604800; samesite=strict`;
    setToken(newToken);
    setUser(newUser);
    router.refresh(); 
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Clear cookie
    document.cookie = "token=; path=/; max-age=0; samesite=strict";
    setToken(null);
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const updateUser = (newUser: User) => {
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
    router.refresh();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
