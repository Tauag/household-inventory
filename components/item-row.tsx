"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon, MinusSignIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { cn } from "cn";
import { isLow, type Item } from "@/lib/items";
import { useInventory } from "@/components/inventory";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";

export function ItemRow({ item, showBuy = false }: { item: Item; showBuy?: boolean }) {
  const { adjust, openEdit } = useInventory();
  const low = isLow(item);
  const meta = [item.location, item.category].filter(Boolean).join(" · ");

  return (
    <li className="flex items-center gap-3 border-b px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <button
          type="button"
          onClick={() => openEdit(item)}
          className="flex flex-col items-start gap-0.5 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {item.brand ? (
            <span className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
              {item.brand}
            </span>
          ) : null}
          {/* Wraps, never truncates: two products in a line differ only at the
              end of the name, which is the whole identification problem. */}
          <span className="text-[15px] leading-5 font-medium text-pretty">{item.name}</span>
        </button>

        {showBuy && item.purchase_url ? (
          <Button
            variant="outline"
            size="xl"
            className="mt-1.5"
            nativeButton={false}
            render={
              <a href={item.purchase_url} target="_blank" rel="noopener noreferrer" />
            }
          >
            <HugeiconsIcon icon={LinkSquare02Icon} />
            Reorder
          </Button>
        ) : meta ? (
          <span className="text-xs text-muted-foreground">{meta}</span>
        ) : null}
      </div>

      <ButtonGroup className="shrink-0">
        <Button
          variant="outline"
          size="icon-xl"
          disabled={item.quantity === 0}
          onClick={() => adjust(item, -1)}
          aria-label={`Use one ${item.name}`}
        >
          <HugeiconsIcon icon={MinusSignIcon} />
        </Button>
        <ButtonGroupText
          aria-live="polite"
          className={cn(
            "h-11 w-11 justify-center gap-0 bg-background px-0 text-[15px] tabular-nums",
            low && "bg-destructive/8 text-destructive"
          )}
        >
          {item.quantity}
          <span className="sr-only">{low ? " left, low stock" : " left"}</span>
        </ButtonGroupText>
        <Button
          variant="outline"
          size="icon-xl"
          onClick={() => adjust(item, 1)}
          aria-label={`Restock one ${item.name}`}
        >
          <HugeiconsIcon icon={PlusSignIcon} />
        </Button>
      </ButtonGroup>
    </li>
  );
}
