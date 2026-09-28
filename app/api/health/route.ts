// Uptime monitors poll this. Skips the auth cookie client on purpose: it only checks Supabase is reachable.
export async function GET() {
	try {
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/items?select=id&limit=1`,
			{
				headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
				signal: AbortSignal.timeout(5000),
			},
		);
		if (!res.ok) throw new Error(`Supabase returned ${res.status}`);
		return Response.json({ ok: true });
	} catch (error) {
		console.error("health check failed", error);
		return Response.json({ ok: false }, { status: 503 });
	}
}
