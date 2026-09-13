"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Sentinel for the "Add new category" select item. Not a real category value.
const ADD_CATEGORY = "__add__";

export function CategoryField({
  categories,
  defaultValue,
}: {
  categories: string[];
  defaultValue: string;
}) {
  const [adding, setAdding] = React.useState(false);
  const [selected, setSelected] = React.useState(defaultValue);
  const id = React.useId();

  if (adding) {
    return (
      <Field>
        <FieldLabel htmlFor={id}>Category</FieldLabel>
        <div className="flex gap-2">
          <Input
            id={id}
            name="category"
            className="h-11"
            autoComplete="off"
            placeholder="New category"
          />
          <Button
            type="button"
            variant="outline"
            size="icon-xl"
            className="shrink-0"
            onClick={() => setAdding(false)}
          >
            <HugeiconsIcon icon={Cancel01Icon} />
          </Button>
        </div>
      </Field>
    );
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>Category</FieldLabel>
      <Select
        name="category"
        value={selected}
        onValueChange={(value) =>
          value === ADD_CATEGORY ? setAdding(true) : setSelected(value ?? "")
        }
      >
        <SelectTrigger id={id} className="h-11! w-full">
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">None</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value={ADD_CATEGORY}>
            <HugeiconsIcon icon={PlusSignIcon} />
            Add new category
          </SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}
