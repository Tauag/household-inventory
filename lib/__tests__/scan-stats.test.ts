import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyTrial, median, recordFrame, summarize } from "../scan-stats.ts";

test("median averages the two middles on an even count and sorts numerically", () => {
  assert.equal(median([]), null);
  assert.equal(median([5]), 5);
  assert.equal(median([3, 1]), 2);
  assert.equal(median([100, 9, 20]), 20, "string sort would put 100 in the middle");
});

test("firstHitMs keeps the first hit, not the latest", () => {
  let trial = emptyTrial();
  trial = recordFrame(trial, { elapsedMs: 200, decodeMs: 180, code: undefined });
  trial = recordFrame(trial, { elapsedMs: 900, decodeMs: 150, code: "8801234567890" });
  trial = recordFrame(trial, { elapsedMs: 1400, decodeMs: 140, code: "8801234567890" });

  const s = summarize(trial);
  assert.equal(s.firstHitMs, 900);
  assert.equal(s.frames, 3);
  assert.equal(s.hits, 2);
  assert.equal(s.hitRate, 2 / 3);
  assert.equal(s.medianDecodeMs, 150);
  assert.deepEqual(s.codes, { "8801234567890": 2 });
});

test("a misread shows up as a second code", () => {
  let trial = emptyTrial();
  trial = recordFrame(trial, { elapsedMs: 100, decodeMs: 90, code: "8801234567890" });
  trial = recordFrame(trial, { elapsedMs: 200, decodeMs: 90, code: "0000000000000" });
  trial = recordFrame(trial, { elapsedMs: 300, decodeMs: 90, code: "8801234567890" });

  assert.deepEqual(Object.keys(summarize(trial).codes), ["8801234567890", "0000000000000"]);
});

test("an all-miss trial reports a zero rate rather than dividing by zero", () => {
  const s = summarize(emptyTrial());
  assert.equal(s.hitRate, 0);
  assert.equal(s.firstHitMs, null);
  assert.equal(s.medianDecodeMs, null);
});
