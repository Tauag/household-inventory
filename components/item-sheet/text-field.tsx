"use client";

import * as React from "react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function TextField({
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
