
"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  Package, 
  TrendingUp, 
  Activity,
  AlertCircle
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function fetchStats() {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }
  
  const res = await fetch("/api/admin/stats", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include", // 确保带上 Cookie，保持与 Middleware 鉴权一致
  });
  
  if (res.status === 401 || res.status === 403) {
    throw new Error("Unauthorized access");
  }
  
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export default function AdminDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchStats,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">加载数据中...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500 space-y-4">
        <AlertCircle className="w-12 h-12" />
        <p className="text-lg font-medium">数据加载失败</p>
        <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  const { overview, trends } = data || {};

  return (
    <div className="space-y-6">
      <div>
        {/* 用户数据行 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
            <Users className="w-5 h-5" /> 用户指标
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="总用户数"
              value={overview?.totalUsers}
              subtext="平台累计注册"
              icon={Users}
              trend={overview?.newUsersToday > 0 ? `+${overview?.newUsersToday} 今日` : undefined}
            />
            <StatCard
              title="月活跃用户 (MAU)"
              value={overview?.activeUsers}
              subtext="近30天活跃"
              icon={Activity}
              className="bg-blue-50/50 dark:bg-blue-950/20"
            />
            <StatCard
              title="日活跃用户 (DAU)"
              value={overview?.dailyActiveUsers}
              subtext="今日活跃"
              icon={TrendingUp}
              className="bg-green-50/50 dark:bg-green-950/20"
            />
          </div>
        </section>

        {/* 产品数据行 */}
        <section className="space-y-3 mt-6">
          <h2 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
            <Package className="w-5 h-5" /> 产品指标
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="总发布产品数"
              value={overview?.totalProducts}
              subtext="平台累计发布"
              icon={Package}
            />
            <StatCard
              title="本月新发布"
              value={overview?.monthlyNewProducts}
              subtext="近30天发布"
              icon={Activity}
            />
            <StatCard
              title="今日新发布"
              value={overview?.newProductsToday}
              subtext="今日实时"
              icon={TrendingUp}
              className="bg-orange-50/50 dark:bg-orange-950/20"
            />
          </div>
        </section>
      </div>

      {/* 趋势图区域 */}
      <Tabs defaultValue="users" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              用户活跃趋势
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              新产品发布趋势
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 用户活跃趋势 */}
        <TabsContent value="users" className="mt-0">
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                用户活跃趋势 (近30天)
              </h3>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('zh-CN', {month: 'numeric', day: 'numeric'})}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="activeUsers"
                      name="活跃用户"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 产品发布趋势 */}
        <TabsContent value="products" className="mt-0">
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-green-500" />
                新产品发布趋势 (近30天)
              </h3>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('zh-CN', {month: 'numeric', day: 'numeric'})}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="newProducts"
                      name="新发布产品"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, subtext, icon: Icon, className, trend }: any) {
  return (
    <div className={`rounded-xl border bg-card text-card-foreground shadow p-6 transition-all hover:shadow-md ${className}`}>
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{title}</h3>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/70" />}
      </div>
      <div className="flex items-end gap-2">
        <div className="text-3xl font-bold">{value ?? "--"}</div>
        {trend && <span className="text-xs font-medium text-green-600 mb-1 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">{trend}</span>}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
    </div>
  );
}
