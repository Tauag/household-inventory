import * as React from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

// Rewritten from the registry's effect-plus-setState version, which trips
// react-hooks/set-state-in-effect. matchMedia is an external store, so the
// server snapshot is an explicit false and the client corrects on hydration.
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}
