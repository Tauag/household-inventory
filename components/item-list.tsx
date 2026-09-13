"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Cancel01Icon,
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const CHIP = "h-11 min-w-11 rounded-full px-4 text-sm";

function LoadingRows() {
  return (
    <ul className="border-t">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="flex items-center gap-3 border-b px-4 py-3">
          <div className="flex flex-1 flex-col gap-[7px]">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-2.5 w-28" />
          </div>
          <Skeleton className="h-11 w-[132px] rounded-lg" />
        </li>
      ))}
    </ul>
  );
}

export function ItemList({ view }: { view: "all" | "low" }) {
  const { items, categories, openAdd } = useInventory();
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");

  const visible = React.useMemo(() => {
    if (!items) return [];
    if (view === "low") return items.filter(isLow);
    return items.filter(
      (item) =>
        matchesSearch(itemLabel(item), query) &&
        (category === "all" || item.category === category)
    );
  }, [items, query, category, view]);

  // Keep the search and chip row in place while the fetch lands, so the
  // controls don't pop in underneath a thumb that is already reaching.
  if (!items) {
    return (
      <>
        {view === "all" ? (
          <>
            <div className="px-4 pt-1 pb-2.5">
              <InputGroup className="h-11">
                <InputGroupAddon className="pl-3">
                  <HugeiconsIcon icon={Search01Icon} className="size-[18px]" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search brand or name"
                  className="text-[15px]"
                  disabled
                />
              </InputGroup>
            </div>
            <div className="flex gap-2 px-4 pb-3">
              <Skeleton className="h-11 w-14 rounded-full" />
              <Skeleton className="h-11 w-24 rounded-full" />
              <Skeleton className="h-11 w-20 rounded-full" />
            </div>
          </>
        ) : null}
        <LoadingRows />
      </>
    );
  }

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

  if (view === "low") {
    return (
      <>
        <p className="px-4 pt-3 pb-4 text-[13px] text-muted-foreground text-pretty">
          {visible.length === 0
            ? `All ${items.length} items sit above their reorder point.`
            : `${visible.length} ${visible.length === 1 ? "item is" : "items are"} at or below their reorder point.`}
        </p>
        {visible.length === 0 ? (
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-14 rounded-xl">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-6" />
              </EmptyMedia>
              <EmptyTitle>Nothing to reorder</EmptyTitle>
              <EmptyDescription>
                Anything that drops to its reorder point shows up here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="border-t">
            {visible.map((item) => (
              <ItemRow key={item.id} item={item} showBuy />
            ))}
          </ul>
        )}
      </>
    );
  }

  return (
    <>
      <div className="px-4 pt-1 pb-2.5">
        <InputGroup className="h-11">
          <InputGroupAddon className="pl-3">
            <HugeiconsIcon icon={Search01Icon} className="size-[18px]" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brand or name"
            className="text-[15px]"
          />
          {query ? (
            <InputGroupAddon align="inline-end" className="py-0 pr-0.5">
              <InputGroupButton
                size="sm"
                className="size-11 rounded-lg"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <HugeiconsIcon icon={Cancel01Icon} />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
      </div>

      {categories.length > 0 ? (
        <div className="overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

      {visible.length === 0 ? (
        <Empty className="flex-1 border-t">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-14 rounded-xl">
              <HugeiconsIcon icon={Search01Icon} className="size-6" />
            </EmptyMedia>
            <EmptyTitle>{query ? `No match for “${query}”` : "Nothing in this category"}</EmptyTitle>
            <EmptyDescription>
              Search covers brand and product name.
              {category !== "all" ? ` The ${category} filter is also on.` : ""}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2.5">
            {query ? (
              <Button variant="outline" size="xl" onClick={() => setQuery("")}>
                Clear search
              </Button>
            ) : null}
            {category !== "all" ? (
              <Button variant="outline" size="xl" onClick={() => setCategory("all")}>
                Clear filter
              </Button>
            ) : null}
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="border-t">
          {visible.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </>
  );
}
