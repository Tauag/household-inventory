import { AppChrome } from "@/components/app-chrome";
import { InventoryProvider } from "@/components/inventory";
import { Toaster } from "@/components/ui/toast";

export default function AppLayout({ children }: LayoutProps<"/">) {
	return (
		<InventoryProvider>
			<AppChrome>{children}</AppChrome>
			<Toaster />
		</InventoryProvider>
	);
}
