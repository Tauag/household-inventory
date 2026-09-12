import assert from "node:assert/strict";
import { test } from "node:test";
import { decideRoute, isAuthCallbackPath } from "./route-decision.mjs";

// T3 done-when: signed out, any route renders the sign-in screen.
test("signed out is sent to login from any route, but not looped from /login", () => {
  assert.equal(decideRoute({ pathname: "/", email: undefined }), "login");
  assert.equal(decideRoute({ pathname: "/some/deep/route", email: undefined }), "login");
  assert.equal(decideRoute({ pathname: "/login", email: undefined }), "next");
});

// T3 done-when: signed in but not a member renders that screen, not an
// empty inventory.
test("signed in, not a member is sent to not-a-member, including off /login", () => {
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
});

test("signed in member passes through, except /login and /not-a-member send them home", () => {
  assert.equal(decideRoute({ pathname: "/", email: "x@example.com", isMember: true }), "next");
  assert.equal(
    decideRoute({ pathname: "/login", email: "x@example.com", isMember: true }),
    "home",
  );
  assert.equal(
    decideRoute({ pathname: "/not-a-member", email: "x@example.com", isMember: true }),
    "home",
  );
});

test("the OAuth callback always runs, regardless of session state", () => {
  for (const [email, isMember] of [
    [undefined, undefined],
    ["x@example.com", false],
    ["x@example.com", true],
  ]) {
    assert.equal(isAuthCallbackPath("/auth/callback"), true);
    assert.equal(decideRoute({ pathname: "/auth/callback", email, isMember }), "next");
  }
});
