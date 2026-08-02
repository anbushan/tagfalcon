import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "@/components/AdminSidebar";
import Header from "@/components/Header";
import { SidebarProvider } from "@/components/SidebarContext";

const ADMIN_ROLES = ["support", "admin", "super_admin"];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).id) {
    redirect("/login?callbackUrl=/admin/overview");
  }

  const role = (session.user as any).role as string | undefined;
  if (!role || !ADMIN_ROLES.includes(role)) {
    redirect("/app/generator");
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-white dark:bg-yt-dark">
        <Header isAdmin />
        <div className="flex">
          <AdminSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
}
