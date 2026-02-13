
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // 1. 鉴权
    const payload = await verifyAuth(request);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. 获取基础统计数据
    const [
      totalUsers,
      totalProducts,
      newUsersToday,
      newProductsToday,
    ] = await Promise.all([
      // 总用户数
      prisma.user.count(),
      // 总产品数 (不区分状态)
      prisma.product.count(),
      // 今日新增用户
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // 今日新增产品
      prisma.product.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    // 3. 计算活跃用户 (MAU/DAU) - 使用登录日志
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(new Date().setDate(1)); // 本月1号

    // 使用 Promise.all 并行查询
    const [
      mauGroup,
      dauGroup,
      monthlyNewProducts,
      recentLoginLogs,
      recentProducts
    ] = await Promise.all([
      // MAU (30天内登录过的用户数)
      prisma.loginLog.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      // DAU (今日登录过的用户数)
      prisma.loginLog.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: startOfDay } },
      }),
      // 本月新发布产品
      prisma.product.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      // 趋势图数据：获取最近30天的登录日志
      prisma.loginLog.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, userId: true }
      }),
      // 趋势图数据：获取最近30天的新产品
      prisma.product.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true }
      })
    ]);

    const activeUsers = mauGroup.length;
    const dailyActiveUsers = dauGroup.length;

    // 4. 动态生成趋势数据 (最近30天)
    // 内存聚合 - 注意：趋势图通常显示"每日活跃用户数"，即每一天的去重用户数
    const userStats = recentLoginLogs.reduce((acc: Record<string, Set<string>>, log: any) => {
      const date = log.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = new Set();
      }
      acc[date].add(log.userId);
      return acc;
    }, {} as Record<string, Set<string>>);

    const productStats = recentProducts.reduce((acc: Record<string, number>, prod: any) => {
      const date = prod.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const trendData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      trendData.push({
        date: dateStr,
        activeUsers: userStats[dateStr] ? userStats[dateStr].size : 0,
        newProducts: productStats[dateStr] || 0
      });
    }

    return NextResponse.json({
      overview: {
        totalUsers,
        totalProducts,
        newUsersToday,
        newProductsToday,
        activeUsers, // MAU
        dailyActiveUsers, // DAU
        monthlyNewProducts, // Monthly New Products
      },
      trends: trendData,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
