"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowUp01Icon, Archive02Icon } from "@hugeicons/core-free-icons";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Item } from "@/lib/items";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  locations: string[];
  onSave: (data: FormData) => Promise<boolean>;
  onArchive: (item: Item) => void;
};

function TextField({
  label,
  description,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; description?: string }) {
  const id = React.useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        className="h-11"
        autoComplete="off"
        data-1p-ignore=""
        data-lpignore="true"
        data-form-type="other"
        {...props}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

function ItemForm({ item, categories, locations, onSave, onArchive, onOpenChange }: Props) {
  const [more, setMore] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const details = [item?.category, item?.location].filter(Boolean).join(" · ");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const saved = await onSave(new FormData(event.currentTarget));
    setPending(false);
    if (saved) onOpenChange(false);
  }

  return (
    <form
      onSubmit={submit}
      autoComplete="off"
      data-form-type="other"
      className="flex min-h-0 flex-1 flex-col"
    >
      <datalist id="category-options">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="location-options">
        {locations.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>

      <FieldGroup className="min-h-0 flex-1 gap-4 overflow-y-auto px-4 pb-4">
        <TextField label="Name" name="name" defaultValue={item?.name} required autoFocus />
        <TextField label="Brand" name="brand" defaultValue={item?.brand ?? ""} />

        {item ? (
          <TextField
            label="Reorder at"
            name="reorder_at"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            defaultValue={item.reorder_at}
            required
            description="Shows in Low stock at this count or below."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Quantity"
              name="quantity"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={1}
              required
            />
            <TextField
              label="Reorder at"
              name="reorder_at"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={0}
              required
            />
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          size="xl"
          onClick={() => setMore((v) => !v)}
          className="-mx-2 justify-between font-medium text-muted-foreground"
        >
          More details
          <span className="flex items-center gap-2">
            <span className="text-xs font-normal">
              {details || "Category, location, link, notes"}
            </span>
            <HugeiconsIcon icon={more ? ArrowUp01Icon : ArrowDown01Icon} />
          </span>
        </Button>

        <div hidden={!more} className="flex flex-col gap-4">
          <TextField
            label="Category"
            name="category"
            list="category-options"
            defaultValue={item?.category ?? ""}
          />
          <TextField
            label="Location"
            name="location"
            list="location-options"
            defaultValue={item?.location ?? ""}
          />
          <TextField
            label="Purchase link"
            name="purchase_url"
            type="url"
            inputMode="url"
            placeholder="https://"
            defaultValue={item?.purchase_url ?? ""}
          />
          <Field>
            <FieldLabel htmlFor="notes">Notes</FieldLabel>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              autoComplete="off"
              data-1p-ignore=""
              data-lpignore="true"
              data-form-type="other"
              defaultValue={item?.notes ?? ""}
            />
          </Field>
        </div>
      </FieldGroup>

      <div className="flex flex-col gap-2.5 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button type="submit" size="xl" disabled={pending}>
          {item ? "Save changes" : "Add item"}
        </Button>
        {item ? (
          <>
            <Button
              type="button"
              variant="destructive"
              size="xl"
              onClick={() => onArchive(item)}
            >
              <HugeiconsIcon icon={Archive02Icon} />
              Archive item
            </Button>
            <p className="text-center text-xs text-muted-foreground text-pretty">
              Archiving hides the item and keeps its history. You can undo it right after.
            </p>
          </>
        ) : null}
      </div>
    </form>
  );
}

export function ItemSheet(props: Props) {
  const isMobile = useIsMobile();
  const { item, open, onOpenChange } = props;

  const title = item ? "Edit item" : "Add item";
  const description = item
    ? "Update the details of this item."
    : "Only name and quantity are required.";

  const form = <ItemForm key={item?.id ?? "new"} {...props} />;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[92dvh] gap-0 rounded-t-xl pt-2"
        >
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
