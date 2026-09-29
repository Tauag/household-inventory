import { redirect } from "next/navigation";
import { AppChrome } from "@/components/app-chrome";
import { InventoryProvider } from "@/components/inventory";
import { Toaster } from "@/components/ui/toast";
import { ITEM_COLUMNS } from "@/lib/items";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
	const supabase = await createClient();
	const { data } = await supabase.auth.getClaims();

	if (!data) redirect("/login");

	// On error, null makes the client load (and toast) as before.
	const { data: items } = await supabase
		.from("items")
		.select(ITEM_COLUMNS)
		.is("archived_at", null)
		.order("name");

	return (
		<InventoryProvider initialItems={items ?? null}>
			<AppChrome email={String(data.claims.email ?? "")}>{children}</AppChrome>
			<Toaster />
		</InventoryProvider>
	);
}
