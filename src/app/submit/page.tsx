import { SubmitForm } from "@/components/SubmitForm";
import { Navbar } from "@/components/Navbar";
import { FluidLogo } from "@/components/FluidLogo";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SubmitPage() {
  const categories = await prisma.category.findMany({
    where: {
      type: "normal"
    },
    orderBy: { order: "asc" },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SubmitForm categories={categories} />
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