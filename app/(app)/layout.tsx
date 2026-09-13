import { redirect } from "next/navigation";
import { AppChrome } from "@/components/app-chrome";
import { InventoryProvider } from "@/components/inventory";
import { Toaster } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data) redirect("/login");

  return (
    <InventoryProvider>
      <AppChrome email={String(data.claims.email ?? "")}>{children}</AppChrome>
      <Toaster />
    </InventoryProvider>
  );
}
