const CACHE = "shell-v2";
const SHELL_ASSETS = [
	"/manifest.json",
	"/icons/icon-192.png",
	"/icons/icon-512.png",
];
// The signed-in pages. They read no cookies, so one cached copy fits every
// user, and serving it skips Netlify's cold function on launch.
const PAGES = ["/", "/low", "/scan"];
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
	const update = network
		.then((res) => store(cache, pathname, res.clone(), cachedHtml))
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
		// The old build's chunks are gone from Netlify anyway; drop them so the
		// cache holds one build at a time.
		const keys = await cache.keys();
		await Promise.all(
			keys
				.filter((req) => new URL(req.url).pathname.startsWith("/_next/static/"))
				.map((req) => cache.delete(req)),
		);
	}
	await cache.put(pathname, res);
	return changed;
}

// The page asks once it has loaded, so no message gets sent before it listens.
self.addEventListener("message", (event) => {
	if (event.data !== "update?") return;
	pendingUpdate.then((changed) => {
		if (changed) event.source.postMessage("update-ready");
	});
});
