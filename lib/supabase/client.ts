import { createBrowserClient } from "@supabase/ssr";

// Singleton under the hood; call this wherever a client component needs it.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
