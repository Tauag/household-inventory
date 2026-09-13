"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowUp01Icon, Archive02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { CategoryField } from "./category-field";
import { TextField } from "./text-field";
import type { ItemSheetProps } from "./types";

export function ItemForm({
  item,
  categories,
  locations,
  prefillBarcode,
  onSave,
  onArchive,
  onOpenChange,
}: ItemSheetProps) {
  const barcode = item?.barcode ?? prefillBarcode ?? "";
  // Open "More details" by default when there's a barcode to show, so a scan
  // doesn't look like it did nothing.
  const [more, setMore] = React.useState(!!barcode);
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
      <datalist id="location-options">
        {locations.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>

      <FieldGroup className="min-h-0 flex-1 gap-4 overflow-y-auto px-4 pb-4">
        <TextField label="Name" name="name" defaultValue={item?.name} required />
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
          <CategoryField categories={categories} defaultValue={item?.category ?? ""} />
          <TextField
            label="Location"
            name="location"
            list="location-options"
            defaultValue={item?.location ?? ""}
          />
          <TextField
            label="Barcode"
            name="barcode"
            inputMode="numeric"
            defaultValue={barcode}
            description={prefillBarcode && !item ? "From the scan. Edit it if it's wrong." : undefined}
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
