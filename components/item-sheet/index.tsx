"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ItemForm } from "./item-form";
import type { ItemSheetProps } from "./types";

export function ItemSheet(props: ItemSheetProps) {
  const isMobile = useIsMobile();
  const { item, open, onOpenChange, prefillBarcode, prefillBrand, prefillName } = props;

  const title = item ? "Edit item" : "Add item";
  const description = item
    ? "Update the details of this item."
    : "Only name and quantity are required.";

  // Remount on a new prefill too, so a second scan's default value isn't
  // shadowed by whatever the first scan's form still has mounted. Brand and
  // name are in the key because the barcode lookup arrives after the sheet
  // is already open and the fields are uncontrolled.
  // lazy: this remount also wipes a fast typist's edits if the lookup lands
  // late. Upgrade path if that ever bites: only remount when the form is
  // still pristine.
  const form = (
    <ItemForm
      key={item?.id ?? `new:${prefillBarcode ?? ""}:${prefillBrand ?? ""}:${prefillName ?? ""}`}
      {...props}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[92dvh] gap-0 rounded-t-xl pt-2">
          <div aria-hidden className="mx-auto h-1 w-9 shrink-0 rounded-full bg-border" />
          <SheetHeader className="pb-2">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          {form}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}
