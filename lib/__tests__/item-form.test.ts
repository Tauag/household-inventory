import assert from "node:assert/strict";
import { test } from "node:test";
import { parseItemForm } from "../item-form.ts";

function formData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const required = { name: "Cream", quantity: "0", reorder_at: "1" };

test("parseItemForm", () => {
  const full = parseItemForm(
    formData({ ...required, name: " Cream ", brand: " Aestura ", category: "Skincare" })
  );
  assert.equal(full.name, "Cream", "name is trimmed");
  assert.equal(full.brand, "Aestura", "brand is trimmed");
  assert.equal(full.category, "Skincare");

  const blank = parseItemForm(formData(required));
  assert.equal(blank.brand, null, "blank brand becomes null, not an empty string");
  assert.equal(blank.category, null, "blank category becomes null");

  assert.throws(
    () => parseItemForm(formData({ ...required, name: "   " })),
    "whitespace-only name is rejected"
  );
});
