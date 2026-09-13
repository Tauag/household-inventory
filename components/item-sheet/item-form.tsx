"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Archive02Icon,
  LinkSquare02Icon,
  MinusSignIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { itemLabel } from "@/lib/items";
import { matchesSearch } from "@/lib/search";
import { CategoryField } from "./category-field";
import { TextField } from "./text-field";
import type { ItemSheetProps } from "./types";

export function ItemForm({
  item,
  items,
  categories,
  locations,
  prefillBarcode,
  prefillBrand,
  prefillName,
  onSave,
  onArchive,
  onAdjust,
  onAttachExisting,
  onOpenChange,
}: ItemSheetProps) {
  // Prefer the freshly-scanned code over a stale one already on the item,
  // so attaching a scan to an existing item shows what's about to be saved.
  const barcode = prefillBarcode ?? item?.barcode ?? "";
  const [more, setMore] = React.useState(!!barcode);
  const [pending, setPending] = React.useState(false);
  const [matchQuery, setMatchQuery] = React.useState("");
  const [purchaseUrl, setPurchaseUrl] = React.useState(item?.purchase_url ?? "");

  const details = [item?.category, item?.location].filter(Boolean).join(" · ");

  // Only offered when a scan matched no barcode: lets that scan attach to an
  // item that already exists instead of Save creating a duplicate.
  const showMatch = !item && !!prefillBarcode;
  const matches = React.useMemo(
    () =>
      showMatch && matchQuery
        ? (items ?? []).filter((i) => matchesSearch(itemLabel(i), matchQuery)).slice(0, 5)
        : [],
    [showMatch, items, matchQuery]
  );

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
        {showMatch ? (
          <Field>
            <FieldLabel htmlFor="match-existing">Already have this item?</FieldLabel>
            <Input
              id="match-existing"
              className="h-11"
              placeholder="Search your items"
              value={matchQuery}
              onChange={(e) => setMatchQuery(e.target.value)}
            />
            {matches.length > 0 ? (
              <ul className="flex flex-col gap-1 rounded-lg border p-1">
                {matches.map((match) => (
                  <li key={match.id}>
                    <button
                      type="button"
                      onClick={() => onAttachExisting(match)}
                      className="w-full rounded-md px-2.5 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted"
                    >
                      {itemLabel(match)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <FieldDescription>
                {matchQuery
                  ? "No match. Fill in the details below to add it as new."
                  : "Attach the scan to it instead of adding a duplicate."}
              </FieldDescription>
            )}
          </Field>
        ) : null}

        <TextField label="Brand" name="brand" defaultValue={item?.brand ?? prefillBrand ?? ""} />
        <TextField label="Name" name="name" defaultValue={item?.name ?? prefillName ?? ""} required />

        {item ? (
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Quantity</FieldLabel>
              <ButtonGroup>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xl"
                  disabled={item.quantity === 0}
                  onClick={() => onAdjust(item, -1)}
                  aria-label={`Use one ${item.name}`}
                >
                  <HugeiconsIcon icon={MinusSignIcon} />
                </Button>
                <ButtonGroupText
                  aria-live="polite"
                  className="h-11 flex-1 justify-center gap-0 bg-background px-0 text-[15px] tabular-nums"
                >
                  {item.quantity}
                </ButtonGroupText>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xl"
                  onClick={() => onAdjust(item, 1)}
                  aria-label={`Restock one ${item.name}`}
                >
                  <HugeiconsIcon icon={PlusSignIcon} />
                </Button>
              </ButtonGroup>
            </Field>
            <TextField
              label="Reorder at"
              name="reorder_at"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={item.reorder_at}
              required
              description="Low stock at this count or below."
            />
          </div>
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
            description={prefillBarcode ? "From the scan. Edit it if it's wrong." : undefined}
          />
          <Field>
            <FieldLabel htmlFor="purchase_url">Purchase link</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="purchase_url"
                name="purchase_url"
                type="url"
                inputMode="url"
                placeholder="https://"
                autoComplete="off"
                data-1p-ignore=""
                data-lpignore="true"
                data-form-type="other"
                value={purchaseUrl}
                onChange={(e) => setPurchaseUrl(e.target.value)}
              />
              {purchaseUrl ? (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label="Open purchase link"
                    nativeButton={false}
                    render={<a href={purchaseUrl} target="_blank" rel="noopener noreferrer" />}
                  >
                    <HugeiconsIcon icon={LinkSquare02Icon} />
                  </InputGroupButton>
                </InputGroupAddon>
              ) : null}
            </InputGroup>
          </Field>
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
