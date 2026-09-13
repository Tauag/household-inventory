import assert from "node:assert/strict";
import { test } from "node:test";
import { applyDelta, isLow, itemLabel } from "../items.ts";

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
