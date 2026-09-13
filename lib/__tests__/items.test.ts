import assert from "node:assert/strict";
import { test } from "node:test";
import { applyDelta, findByBarcode, isLow, itemLabel, type Item } from "../items.ts";

test("isLow triggers at the reorder point, not only below it", () => {
  assert.ok(isLow({ quantity: 1, reorder_at: 1 }), "equal to the reorder point is low");
  assert.ok(isLow({ quantity: 0, reorder_at: 1 }), "below the reorder point is low");
  assert.ok(!isLow({ quantity: 2, reorder_at: 1 }), "above the reorder point is not low");
  assert.ok(isLow({ quantity: 0, reorder_at: 0 }), "a zero reorder point still flags at zero");
});

test("applyDelta clamps at zero like the adjust_quantity RPC", () => {
  assert.equal(applyDelta(3, -1), 2);
  assert.equal(applyDelta(3, 1), 4);
  assert.equal(applyDelta(0, -1), 0, "decrementing zero stays at zero");
  assert.equal(applyDelta(1, -5), 0, "an overshoot clamps rather than going negative");
});

test("itemLabel omits a missing brand", () => {
  assert.equal(itemLabel({ brand: "Aestura", name: "Atobarrier 365 Cream" }), "Aestura Atobarrier 365 Cream");
  assert.equal(itemLabel({ brand: null, name: "Cotton rounds" }), "Cotton rounds");
});

test("findByBarcode resolves a bound code and ignores unbound items", () => {
  const items = [
    { id: "1", barcode: "012345678905" },
    { id: "2", barcode: null },
  ] as Item[];
  assert.equal(findByBarcode(items, "012345678905")?.id, "1");
  assert.equal(findByBarcode(items, "000000000000"), undefined, "an unknown code is a miss");
  assert.equal(findByBarcode(null, "012345678905"), undefined, "no items loaded yet is a miss");
});
