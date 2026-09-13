import { NextResponse } from "next/server";
import { parseProduct } from "@/lib/barcode-lookup";

// No Supabase client here at all, so there's no key to reach for, anon or
// otherwise. The API is public, keyless, and hit only from this route,
// never with a browser-supplied host or path.
export async function GET(_request: Request, { params }: RouteContext<"/api/barcode/[code]">) {
  const { code } = await params;

  try {
    const res = await fetch(
      `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(code)}.json`,
      { signal: AbortSignal.timeout(5000) }
    );
    const hit = res.ok ? parseProduct(await res.json()) : null;
    if (hit) return NextResponse.json(hit);
  } catch {
    // Network hiccup or timeout; a miss still lands the scan on the
    // prefilled form instead of erroring.
  }

  return NextResponse.json(null, { status: 404 });
}
