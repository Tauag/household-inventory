import assert from "node:assert/strict";
import { test } from "node:test";
import { matchesSearch } from "../search.ts";

const item = "Aestura Atobarrier 365 Cream";

test("matchesSearch", () => {
  assert.ok(matchesSearch(item, "atobarrier"), "plain substring should match");
  assert.ok(matchesSearch(item, "aestura ato"), "space in query should still match across words");
  assert.ok(matchesSearch(item, "AESTURA"), "match is case-insensitive");
  assert.ok(!matchesSearch(item, "xyz"), "non-substring should not match");
  assert.ok(matchesSearch(item, ""), "empty query matches everything");
});
