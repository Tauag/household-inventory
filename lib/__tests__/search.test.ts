import assert from "node:assert";
import { matchesSearch } from "../search.ts";

const item = "Aestura Atobarrier 365 Cream";

assert.ok(matchesSearch(item, "atobarrier"), "plain substring should match");
assert.ok(matchesSearch(item, "aestura ato"), "space in query should still match across words");
assert.ok(matchesSearch(item, "AESTURA"), "match is case-insensitive");
assert.ok(!matchesSearch(item, "xyz"), "non-substring should not match");
assert.ok(matchesSearch(item, ""), "empty query matches everything");

console.log("ok");
