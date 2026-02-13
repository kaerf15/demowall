"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { FluidLogo } from "@/components/FluidLogo";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log('Attempting login with:', { identifier: formData.username, type: 'password' });
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formData.username,
          credential: formData.password,
          type: "password",
        }),
      });

      console.log('Login response status:', res.status);
      const data = await res.json();
      console.log('Login response data:', data);

      if (res.ok) {
        // 保存 token 到 localStorage 和 Cookie (为了 Middleware)
        // localStorage.setItem("token", data.token);
        // localStorage.setItem("user", JSON.stringify(data.user));
        
        // 使用 AuthContext 的 login 方法统一处理（包含 localStorage 和 Cookie）
        login(data.token, data.user);
        
        // 登录成功后统一跳转到首页，由用户自行选择进入管理后台
        router.push("/");
      } else {
        setError(data.error || "登录失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-md mx-auto px-4 pt-20">
        <Card className="border border-border/50 shadow-xl shadow-primary/5">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold">欢迎回来</CardTitle>
            <p className="text-muted-foreground mt-2">
              登录你的 DemoWall 账号
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2">
                  用户名或邮箱
                </label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="输入用户名或邮箱"
                  className="bg-secondary/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/30"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  密码
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="输入密码"
                    className="bg-secondary/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/30 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "隐藏密码" : "显示密码"}
                    </span>
                  </Button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 text-base shadow-lg shadow-primary/25 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    登录中...
                  </span>
                ) : (
                  "登录"
                )}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                还没有账号？{" "}
                <Link
                  href="/register"
                  className="text-primary hover:underline font-medium"
                >
                  立即注册
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
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
