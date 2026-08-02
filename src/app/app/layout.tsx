import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AppSidebar from "@/components/AppSidebar";
import Header from "@/components/Header";
import { SidebarProvider } from "@/components/SidebarContext";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    redirect("/login?callbackUrl=/app/generator");
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-white dark:bg-yt-dark">
        <Header />
        <div className="flex">
          <AppSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
}
