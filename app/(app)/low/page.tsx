import { ItemList } from "@/components/item-list";

export const metadata = { title: "Low stock" };

export default function LowStockPage() {
  return <ItemList view="low" />;
}
