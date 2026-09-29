import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
	decideRoute,
	isAuthCallbackPath,
} from "@/lib/supabase/route-decision.mjs";

// Next.js 16 renamed the middleware.ts convention to proxy.ts; behavior is
// unchanged. See node_modules/next/dist/docs/.../proxy.md.

export async function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const cookiesToSet: {
		name: string;
		value: string;
		options: CookieOptions;
	}[] = [];

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
		{
			cookies: {
				getAll: () => request.cookies.getAll(),
				setAll: (cookies) => {
					cookies.forEach(({ name, value }) => {
						request.cookies.set(name, value);
					});
					cookiesToSet.push(...cookies);
				},
			},
		},
	);

	// getClaims verifies the JWT (locally against the project's JWKS, or via
	// the auth server as a fallback) rather than trusting the cookie as-is.
	const { data } = await supabase.auth.getClaims();
	const email = data?.claims.email as string | undefined;

	// The token hook sets is_member at issue time. Anything but true (hook off,
	// old token, or member added since) re-checks live so nobody is locked out.
	let isMember = data?.claims.is_member === true;
	if (email && !isMember && !isAuthCallbackPath(pathname)) {
		const { data: memberData } = await supabase.rpc("is_member");
		isMember = Boolean(memberData);
	}

	const route = decideRoute({ pathname, email, isMember });
	const response =
		route === "next"
			? NextResponse.next({ request })
			: route === "home"
				? NextResponse.redirect(new URL("/", request.url))
				: NextResponse.rewrite(new URL(`/${route}`, request.url));

	cookiesToSet.forEach(({ name, value, options }) => {
		response.cookies.set(name, value, options);
	});
	return response;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|monitoring|api/health|scan/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
	],
};
