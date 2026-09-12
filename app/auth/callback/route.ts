import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase redirects here with ?code=... after the Google OAuth round trip,
// or with ?error=... if the provider or Supabase Auth rejected the request
// before a code was ever issued (e.g. the redirect URL isn't allow-listed).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const providerError = searchParams.get("error_description") ?? searchParams.get("error");

  if (providerError) {
    console.error("[auth/callback] provider/auth error:", providerError);
    return NextResponse.redirect(`${origin}/login`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/login`);
}
