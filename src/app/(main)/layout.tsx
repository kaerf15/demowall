
"use client";

import { Navbar } from "@/components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 
        TODO: Navbar 内部逻辑需要拆解
        目前 Navbar 包含 Search Input，且强绑定了 useHomeLogic 的 handleSearch
        在解耦方案中，Navbar 应该只负责导航和用户菜单，搜索框应该作为 children 或 slot 传入
        或者 Navbar 仅在首页显示搜索框。
        
        临时方案：先渲染 Navbar，但注意它内部的 onSearch 可能在非首页失效。
        理想方案：重构 Navbar，使其更纯粹。
      */}
      {/* <Navbar />  <-- 暂时移除，由各个 Page 自己决定是否渲染 Navbar，或者重构 Navbar */}
      {/* 
        修正：由于现有页面 (page.tsx, profile/page.tsx) 内部都自己调用了 Navbar，
        所以这里如果再加 Navbar 会导致重复。
        
        策略：
        1. 保持现状，layout 不加 Navbar，由页面自己加 (虽然不 DRY，但安全)。
        2. 或者，把页面里的 Navbar 删掉，统一在这里加。
        
        鉴于要"解耦"，我们先把布局结构搭好。
        为了不破坏现有逻辑，我们暂时不在这个 Layout 里加 Navbar，
        而是作为一个 Wrapper 存在。
      */}
      {children}
    </>
  );
}
