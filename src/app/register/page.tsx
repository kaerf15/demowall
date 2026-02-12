"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { FluidLogo } from "@/components/FluidLogo";

// 移除预设头像列表
// const PRESET_AVATARS = [...]

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    // avatar: PRESET_AVATARS[0], // 移除默认头像
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 验证密码
    if (formData.password !== formData.confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (formData.password.length < 6) {
      setError("密码至少需要6个字符");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          // avatar: formData.avatar, // 移除头像
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // 保存 token 和用户信息
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "注册失败");
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

      <main className="max-w-md mx-auto px-4 pt-12 pb-20">
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold">创建账号</CardTitle>
            <p className="text-muted-foreground mt-2">
              加入 DemoWall 社区，发现和分享优秀产品
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* 头像选择 - 已移除 */}
              {/* 
              <div>
                <label className="block text-sm font-semibold mb-3">
                  选择头像
                </label>
                ...
              </div>
              */}

              <div>
                <label className="block text-sm font-semibold mb-2">
                  用户名 *
                </label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="设置用户名（仅字母、数字、下划线，15字内）"
                  className="bg-secondary/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/30"
                  required
                  pattern="^[a-zA-Z0-9_]+$"
                  maxLength={15}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  邮箱 *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your@email.com"
                  className="bg-secondary/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/30"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  密码 *
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="设置密码（至少6位）"
                  className="bg-secondary/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/30"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  确认密码 *
                </label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder="再次输入密码"
                  className="bg-secondary/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/30"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full h-11 text-base shadow-lg shadow-primary/25"
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
                    注册中...
                  </span>
                ) : (
                  "创建账号"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                已有账号？{" "}
                <Link
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  立即登录
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-card border-t">
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
