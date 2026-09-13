import { NextResponse } from "next/server";
import { parseProduct, type BarcodeHit } from "@/lib/barcode-lookup";

// Beauty first: that's the poorly-covered category this app mostly scans.
// Food Facts is the fallback for the household's actual pantry items.
const HOSTS = ["world.openbeautyfacts.org", "world.openfoodfacts.org"];

async function lookup(host: string, code: string): Promise<BarcodeHit | null> {
  const res = await fetch(`https://${host}/api/v2/product/${encodeURIComponent(code)}.json`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  return parseProduct(await res.json());
}

// No Supabase client here at all, so there's no key to reach for, anon or
// otherwise. Both APIs are public, keyless, and hit only from this route,
// never with a browser-supplied host or path.
export async function GET(_request: Request, { params }: RouteContext<"/api/barcode/[code]">) {
  const { code } = await params;

  for (const host of HOSTS) {
    try {
      const hit = await lookup(host, code);
      if (hit) return NextResponse.json(hit);
    } catch {
      // Network hiccup or timeout on this source; try the next one. A miss
      // on both still lands the scan on the prefilled form, never an error.
    }
  }

  return NextResponse.json(null, { status: 404 });
}
