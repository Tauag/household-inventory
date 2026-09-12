import assert from "node:assert/strict";
import { decideRoute, isOpenPath } from "./route-decision.mjs";

// signed out, any route renders the sign-in screen.
assert.equal(decideRoute({ pathname: "/", email: undefined }), "login");
assert.equal(decideRoute({ pathname: "/some/deep/route", email: undefined }), "login");

// signed in but not a member renders that screen, not an empty inventory.
assert.equal(
  decideRoute({ pathname: "/", email: "x@example.com", isMember: false }),
  "not-a-member",
);

// Signed in and a member: through.
assert.equal(
  decideRoute({ pathname: "/", email: "x@example.com", isMember: true }),
  "next",
);

// Open paths always render regardless of session state, or /login and
// /auth/callback would redirect-loop against themselves.
for (const pathname of ["/login", "/not-a-member", "/auth/callback"]) {
  assert.equal(isOpenPath(pathname), true);
  assert.equal(decideRoute({ pathname, email: undefined }), "next");
}

console.log("route-decision: all assertions passed");
