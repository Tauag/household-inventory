"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
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
  const { item, open, onOpenChange, prefillBarcode, prefillBrand, prefillName, looking } = props;

  const titleText = item ? "Edit item" : "Add item";
  const title = (
    <>
      {titleText}
      {looking ? (
        <HugeiconsIcon
          icon={Loading03Icon}
          className="size-4 animate-spin text-muted-foreground"
          aria-label="Looking up barcode"
        />
      ) : null}
    </>
  );
  const description = item
    ? "Update the details of this item."
    : "Only name and quantity are required.";

  // Remount on a new prefill too, so a second scan's default value isn't
  // shadowed by whatever the first scan's form still has mounted.
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
            <SheetTitle className="flex items-center gap-2">{title}</SheetTitle>
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
          <DialogTitle className="flex items-center gap-2">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}
