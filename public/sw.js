const CACHE = "shell-v2";
const SHELL_ASSETS = [
	"/manifest.json",
	"/icons/icon-192.png",
	"/icons/icon-512.png",
];
// The signed-in pages. They read no cookies, so one cached copy fits every
// user, and serving it skips Netlify's cold function on launch.
const PAGES = ["/", "/low", "/scan"];
// Cache entry listing the old build's chunks, to delete on the next page load.
const STALE = "/__stale-chunks";
// Dev rebuilds chunks under the same URLs, so caching them there serves stale code.
const DEV = location.hostname === "localhost";

// Settles to true when the last page fetch found a newer deploy.
let pendingUpdate = Promise.resolve(false);

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE).then((cache) => cache.addAll(SHELL_ASSETS)),
	);
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
				),
			),
	);
	self.clients.claim();
});

self.addEventListener("fetch", (event) => {
	const { pathname } = new URL(event.request.url);

	if (SHELL_ASSETS.includes(pathname)) {
		event.respondWith(
			caches
				.match(event.request)
				.then((cached) => cached ?? fetch(event.request)),
		);
	} else if (DEV) {
		return;
	} else if (event.request.mode === "navigate" && PAGES.includes(pathname)) {
		event.respondWith(servePage(event, pathname));
	} else if (pathname.startsWith("/_next/static/")) {
		// Hashed names never change. Caching them keeps a stale page working
		// after a deploy removes its old build from Netlify.
		event.respondWith(
			caches.match(event.request).then(
				(cached) =>
					cached ??
					fetch(event.request).then((res) => {
						if (res.ok) {
							const copy = res.clone();
							caches.open(CACHE).then((c) => c.put(event.request, copy));
						}
						return res;
					}),
			),
		);
	}
});

// Serve the cached page at once and refresh it in the background. A new
// deploy shows on the next open, or sooner if the user accepts the prompt.
async function servePage(event, pathname) {
	const cache = await caches.open(CACHE);
	const cached = await cache.match(pathname);
	const cachedHtml = cached?.clone().text();

	const network = fetch(event.request);
	// Registered before the page reads the body, so the clone comes first.
	// Prune only once the network answers: offline, the cached page still needs
	// its chunks. store() waits so it cannot lose a marker it just wrote.
	const update = network
		.then(async (res) => {
			if (res.ok) await pruneStale(cache);
			return store(cache, pathname, res.clone(), cachedHtml);
		})
		.catch(() => false);
	event.waitUntil(update);

	if (!cached) return network;
	pendingUpdate = update;
	return cached;
}

async function store(cache, pathname, res, cachedHtml) {
	// Signed-out and non-member visits get /login or /not-a-member rewritten
	// in, and redirects come back opaque. Never cache those as the app.
	if (!res.ok || res.headers.has("x-middleware-rewrite")) return false;

	const html = await res.clone().text();
	const changed = cachedHtml !== undefined && (await cachedHtml) !== html;
	if (changed) {
		// Drop the other cached pages: they point at the old build.
		const keys = (await cache.keys()).map((req) => new URL(req.url).pathname);
		await Promise.all(
			keys
				.filter((path) => PAGES.includes(path) && path !== pathname)
				.map((path) => cache.delete(path)),
		);
		// The old page is still open and may request old chunks, so only mark
		// them. The next page load deletes them (see pruneStale).
		const marked = await cache.match(STALE);
		const stale = new Set(marked ? await marked.json() : []);
		for (const path of keys) {
			if (path.startsWith("/_next/static/")) stale.add(path);
		}
		// Not Response.json(): iOS 16 lacks it, and a throw here skips caching the page.
		await cache.put(STALE, new Response(JSON.stringify([...stale])));
	}
	await cache.put(pathname, res);
	return changed;
}

// Runs on a page load, after the old-build page is gone.
async function pruneStale(cache) {
	const marked = await cache.match(STALE);
	if (!marked) return;
	// A corrupt marker (eviction mid-write) must not block caching the page.
	const stale = await marked.json().catch(() => []);
	await Promise.all([STALE, ...stale].map((path) => cache.delete(path)));
}

// Find a deploy that landed while the app was open. All pages share one build,
// so compare whichever page is cached: in-app navigation never caches the
// page the user is on.
async function refresh() {
	const cache = await caches.open(CACHE);
	for (const path of PAGES) {
		const cached = await cache.match(path);
		if (!cached) continue;
		const res = await fetch(path).catch(() => null);
		return res ? store(cache, path, res, cached.text()) : false;
	}
	return false;
}

// The page asks once it has loaded, so no message gets sent before it listens.
// "update?" reads the launch's background fetch; "check" fetches again.
self.addEventListener("message", (event) => {
	const reply = (changed) => {
		if (changed) event.source.postMessage("update-ready");
	};
	if (event.data === "update?") pendingUpdate.then(reply);
	else if (event.data === "check") event.waitUntil(refresh().then(reply));
});
