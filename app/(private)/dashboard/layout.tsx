import { createClient } from "@/lib/supabase/server";
import "leaflet/dist/leaflet.css";
import { redirect } from "next/navigation";
import DashboardShell from "./components/DashboardShell";
import { ToastProvider } from "./components/Toast";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <ToastProvider>
      <DashboardShell>{children}</DashboardShell>
    </ToastProvider>
  );
}