// The OAuth code exchange needs to run with no auth check at all, session or
// not, or it can never establish one.
export function isAuthCallbackPath(pathname) {
  return pathname.startsWith("/auth/");
}

/**
 * @param {{ pathname: string, email?: string, isMember?: boolean }} args
 * @returns {"next" | "login" | "not-a-member" | "home"}
 */
export function decideRoute({ pathname, email, isMember }) {
  if (isAuthCallbackPath(pathname)) return "next";

  if (!email) {
    return pathname === "/login" ? "next" : "login";
  }

  if (!isMember) {
    return pathname === "/not-a-member" ? "next" : "not-a-member";
  }

  return pathname === "/login" || pathname === "/not-a-member" ? "home" : "next";
}
