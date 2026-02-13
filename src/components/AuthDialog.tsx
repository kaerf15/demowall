"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export function AuthDialog({ 
  children, 
  open, 
  onOpenChange 
}: { 
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { login } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("login"); // login | register
  const [loginMethod, setLoginMethod] = useState("password"); // password | code
  const [forgotPassword, setForgotPassword] = useState(false);

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  
  // Password Visibility States
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Login Form State
  const [loginData, setLoginData] = useState({
    identifier: "",
    credential: "",
  });

  // Register Form State
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    code: "",
  });

  // Reset Password State
  const [resetData, setResetData] = useState({
    email: "",
    code: "",
    newPassword: "",
  });

  // Verification Code Timer
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown > 0]);

  const resetState = () => {
    setError("");
    setForgotPassword(false);
    setLoginMethod("password");
    setCountdown(0);
    setLoginData({ identifier: "", credential: "" });
    setRegisterData({ username: "", email: "", password: "", code: "" });
    setResetData({ email: "", code: "", newPassword: "" });
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const sendCode = async (email: string, type: "REGISTER" | "LOGIN" | "RESET_PASSWORD") => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("请输入有效的邮箱地址");
      return;
    }
    
    setSendingCode(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("验证码已发送");
        setCountdown(60);
      } else {
        setError(data.error || "验证码发送失败");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSendingCode(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginData.identifier,
          credential: loginData.credential,
          type: loginMethod, // password | code
        }),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
        setIsOpen(false);
        toast.success("登录成功");

        // 登录成功后统一跳转到首页，由用户自行选择进入管理后台
        if (pathname === "/login" || pathname === "/register") {
          router.push("/");
        } else {
          // 如果在其他页面（如首页），保持在当前页面
          router.refresh();
        }
      } else {
        setError(data.error || "登录失败");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (registerData.password.length < 6) {
      setError("密码至少需要6个字符");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
        setIsOpen(false);
        toast.success("注册成功");
      } else {
        setError(data.error || "注册失败");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resetData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("密码重置成功，请登录");
        setForgotPassword(false);
        setLoginMethod("password");
        setLoginData({ identifier: resetData.email, credential: "" });
      } else {
        setError(data.error || "重置失败");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] z-[200]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {forgotPassword ? "重置密码" : "欢迎来到 DemoWall"}
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {forgotPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="邮箱"
                value={resetData.email}
                onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="验证码"
                value={resetData.code}
                onChange={(e) => setResetData({ ...resetData, code: e.target.value })}
                required
              />
              <Button 
                type="button" 
                variant="outline"
                disabled={countdown > 0 || sendingCode}
                onClick={() => sendCode(resetData.email, "RESET_PASSWORD")}
                className="w-32 shrink-0"
              >
                {countdown > 0 ? `${countdown}s` : (sendingCode ? "发送中..." : "获取验证码")}
              </Button>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showResetPassword ? "text" : "password"}
                  placeholder="新密码 (至少6位)"
                  value={resetData.newPassword}
                  onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                >
                  {showResetPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <span className="sr-only">
                    {showResetPassword ? "隐藏密码" : "显示密码"}
                  </span>
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? "提交中..." : "重置密码"}
            </Button>
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setForgotPassword(false)}
                className="text-primary hover:underline"
              >
                返回登录
              </button>
            </div>
          </form>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="flex justify-center mb-4 text-sm text-muted-foreground gap-4">
                <button 
                  type="button"
                  className={`hover:text-foreground transition-colors ${loginMethod === 'password' ? 'text-primary font-bold' : ''}`}
                  onClick={() => { setLoginMethod("password"); setLoginData({...loginData, credential: ""}); }}
                >
                  密码登录
                </button>
                <div className="w-[1px] bg-border h-4 self-center" />
                <button 
                  type="button"
                  className={`hover:text-foreground transition-colors ${loginMethod === 'code' ? 'text-primary font-bold' : ''}`}
                  onClick={() => { setLoginMethod("code"); setLoginData({...loginData, credential: ""}); }}
                >
                  验证码登录
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder={loginMethod === "password" ? "用户名或邮箱" : "邮箱"}
                    value={loginData.identifier}
                    onChange={(e) =>
                      setLoginData({ ...loginData, identifier: e.target.value })
                    }
                    required
                  />
                </div>
                
                {loginMethod === "password" ? (
                  <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="密码"
                      value={loginData.credential}
                      onChange={(e) =>
                        setLoginData({ ...loginData, credential: e.target.value })
                      }
                      className="pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                >
                  {showLoginPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <span className="sr-only">
                    {showLoginPassword ? "隐藏密码" : "显示密码"}
                  </span>
                </Button>
                  </div>
                  <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setForgotPassword(true)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        忘记密码？
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="验证码"
                      value={loginData.credential}
                      onChange={(e) =>
                        setLoginData({ ...loginData, credential: e.target.value })
                      }
                      required
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      disabled={countdown > 0 || sendingCode}
                      onClick={() => sendCode(loginData.identifier, "LOGIN")}
                      className="w-32 shrink-0"
                    >
                      {countdown > 0 ? `${countdown}s` : (sendingCode ? "发送中..." : "获取验证码")}
                    </Button>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  {isLoading ? "登录中..." : "登录"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="用户名"
                    value={registerData.username}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, username: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="邮箱"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="密码 (至少6位)"
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, password: e.target.value })
                      }
                      className="pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                >
                  {showRegisterPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <span className="sr-only">
                    {showRegisterPassword ? "隐藏密码" : "显示密码"}
                  </span>
                </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="验证码"
                    value={registerData.code}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, code: e.target.value })
                    }
                    required
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    disabled={countdown > 0 || sendingCode}
                    onClick={() => sendCode(registerData.email, "REGISTER")}
                    className="w-32 shrink-0"
                  >
                    {countdown > 0 ? `${countdown}s` : "获取验证码"}
                  </Button>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  {isLoading ? "注册中..." : "立即注册"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
