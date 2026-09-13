import type { Item } from "@/lib/items";

export type ItemSheetProps = {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  locations: string[];
  prefillBarcode?: string | null;
  onSave: (data: FormData) => Promise<boolean>;
  onArchive: (item: Item) => void;
};
