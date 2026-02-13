
import { AdminSidebar } from "@/components/admin/Sidebar";
import { AdminProvider } from "@/components/admin/AdminProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="w-16 shrink-0 border-r bg-card"> {/* Wrap sidebar in a fixed width container */}
          <AdminSidebar />
        </div>
        <main className="flex-1 overflow-y-auto bg-secondary/10">
          <div className="w-full h-full p-4">
            {children}
          </div>
        </main>
      </div>
    </AdminProvider>
  );
}
