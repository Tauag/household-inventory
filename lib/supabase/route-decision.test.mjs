import assert from "node:assert/strict";
import { decideRoute, isAuthCallbackPath } from "./route-decision.mjs";

// T3 done-when: signed out, any route renders the sign-in screen.
assert.equal(decideRoute({ pathname: "/", email: undefined }), "login");
assert.equal(decideRoute({ pathname: "/some/deep/route", email: undefined }), "login");
// ...but /login itself doesn't rewrite to itself.
assert.equal(decideRoute({ pathname: "/login", email: undefined }), "next");

// T3 done-when: signed in but not a member renders that screen, not an
// empty inventory.
assert.equal(
  decideRoute({ pathname: "/", email: "x@example.com", isMember: false }),
  "not-a-member",
);
// A non-member landing on /login (stale session, wrong account) gets bounced
// to /not-a-member instead of seeing a sign-in button that goes nowhere.
assert.equal(
  decideRoute({ pathname: "/login", email: "x@example.com", isMember: false }),
  "not-a-member",
);
assert.equal(
  decideRoute({ pathname: "/not-a-member", email: "x@example.com", isMember: false }),
  "next",
);

// Signed in and a member: through, except /login and /not-a-member send them
// home instead of re-showing a screen that no longer applies.
assert.equal(
  decideRoute({ pathname: "/", email: "x@example.com", isMember: true }),
  "next",
);
assert.equal(
  decideRoute({ pathname: "/login", email: "x@example.com", isMember: true }),
  "home",
);
assert.equal(
  decideRoute({ pathname: "/not-a-member", email: "x@example.com", isMember: true }),
  "home",
);

// The OAuth callback always runs, regardless of session state.
for (const [email, isMember] of [
  [undefined, undefined],
  ["x@example.com", false],
  ["x@example.com", true],
]) {
  assert.equal(isAuthCallbackPath("/auth/callback"), true);
  assert.equal(decideRoute({ pathname: "/auth/callback", email, isMember }), "next");
}

console.log("route-decision: all assertions passed");
