const OPEN_PATHS = ["/login", "/not-a-member", "/auth/"];

export function isOpenPath(pathname) {
  return OPEN_PATHS.some((p) => pathname.startsWith(p));
}

/**
 * @param {{ pathname: string, email?: string, isMember?: boolean }} args
 * @returns {"next" | "login" | "not-a-member"}
 */
export function decideRoute({ pathname, email, isMember }) {
  if (isOpenPath(pathname)) return "next";
  if (!email) return "login";
  if (!isMember) return "not-a-member";
  return "next";
}
