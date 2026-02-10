import { SubmitForm } from "@/components/SubmitForm";
import { Navbar } from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

export default async function SubmitPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            提交你的产品
          </h1>
          <p className="text-gray-600">
            让更多人发现你的独立作品
          </p>
        </div>

        <SubmitForm categories={categories} />
      </main>

      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 DemoWall. 为独立开发者打造的产品展示平台
          </p>
        </div>
      </footer>
    </div>
  );
}