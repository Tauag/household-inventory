"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  CheckmarkCircle02Icon,
  Package01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { matchesSearch } from "@/lib/search";
import { isLow, itemLabel } from "@/lib/items";
import { useInventory } from "@/components/inventory";
import { ItemRow } from "@/components/item-row";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LoadingRows } from "./loading-rows";

const CHIP = "h-11 min-w-11 rounded-full px-4 text-sm";

export function ItemList({ view }: { view: "all" | "low" }) {
  const { items, categories, openAdd, query, setQuery } = useInventory();
  const [category, setCategory] = React.useState("all");

  const low = React.useMemo(() => items?.filter(isLow) ?? [], [items]);

  const visible = React.useMemo(() => {
    const pool = view === "low" ? low : (items ?? []);
    return pool.filter(
      (item) =>
        matchesSearch(itemLabel(item), query) &&
        (view === "low" || category === "all" || item.category === category)
    );
  }, [items, low, query, category, view]);

  if (!items) return <LoadingRows withChips={view === "all"} />;

  if (items.length === 0) {
    return (
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-14 rounded-xl">
            <HugeiconsIcon icon={Package01Icon} className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Nothing tracked yet</EmptyTitle>
          <EmptyDescription>
            Add the first thing you keep running out of. A name and a count is all it takes.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="xl" onClick={openAdd}>
            <HugeiconsIcon icon={Add01Icon} />
            Add the first item
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (view === "low" && low.length === 0) {
    return (
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-14 rounded-xl">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Nothing to reorder</EmptyTitle>
          <EmptyDescription>
            All {items.length} items sit above their reorder point. Anything that drops to it
            shows up here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const noMatch = visible.length === 0;

  return (
    <>
      {view === "low" ? (
        <p className="px-4 py-3 text-[13px] text-muted-foreground text-pretty">
          {low.length} {low.length === 1 ? "item is" : "items are"} at or below their reorder
          point.
        </p>
      ) : categories.length > 0 ? (
        <div className="overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ToggleGroup
            value={[category]}
            onValueChange={([value]) => setCategory(value ?? "all")}
            className="w-max"
          >
            <ToggleGroupItem value="all" className={CHIP}>
              All
            </ToggleGroupItem>
            {categories.map((c) => (
              <ToggleGroupItem key={c} value={c} className={CHIP}>
                {c}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ) : null}

      {noMatch ? (
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-14 rounded-xl">
              <HugeiconsIcon icon={Search01Icon} className="size-6" />
            </EmptyMedia>
            <EmptyTitle>
              {query ? `No match for “${query}”` : "Nothing in this category"}
            </EmptyTitle>
            <EmptyDescription>
              Search covers brand and product name.
              {category !== "all" && view === "all" ? ` The ${category} filter is also on.` : ""}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2.5">
            {query ? (
              <Button variant="outline" size="xl" onClick={() => setQuery("")}>
                Clear search
              </Button>
            ) : null}
            {category !== "all" && view === "all" ? (
              <Button variant="outline" size="xl" onClick={() => setCategory("all")}>
                Clear filter
              </Button>
            ) : null}
          </EmptyContent>
        </Empty>
      ) : (
        <ul>
          {visible.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </>
  );
}
