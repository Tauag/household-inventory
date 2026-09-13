import type { Item } from "@/lib/items";

export type ItemSheetProps = {
  item: Item | null;
  items: Item[] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  locations: string[];
  prefillBarcode?: string | null;
  prefillBrand?: string | null;
  prefillName?: string | null;
  onSave: (data: FormData) => Promise<boolean>;
  onArchive: (item: Item) => void;
  onAdjust: (item: Item, delta: number) => void;
  onAttachExisting: (item: Item) => void;
};
