import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import PageTransition from "./components/PageTransition";
import { ToastProvider } from "./components/Toast";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <ToastProvider>
      <div
        data-theme="light"
        style={{
          display: "flex", minHeight: "100vh",
          backgroundColor: "#f7f8f7",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <Sidebar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Topbar />
          <main style={{
            flex: 1, overflow: "auto", padding: 32,
            backgroundColor: "#f7f8f7",
          }}>
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}