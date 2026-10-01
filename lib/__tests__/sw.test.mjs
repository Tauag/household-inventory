import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const ORIGIN = "https://example.com";
const abs = (r) => new URL(typeof r === "string" ? r : r.url, ORIGIN).href;

function loadWorker(serve) {
	const store = new Map();
	const cache = {
		match: async (r) => store.get(abs(r))?.clone(),
		put: async (r, res) => void store.set(abs(r), res),
		keys: async () => [...store.keys()].map((u) => new Request(u)),
		delete: async (r) => store.delete(abs(r)),
		addAll: async () => {},
	};
	const handlers = {};
	const ctx = {
		self: { addEventListener: (t, h) => (handlers[t] = h), skipWaiting() {} },
		caches: {
			open: async () => cache,
			match: cache.match,
			keys: async () => [],
		},
		location: { hostname: "example.com" },
		fetch: async (r) => serve(new URL(abs(r)).pathname),
		URL,
		Request,
		Response,
		Promise,
	};
	ctx.self.clients = { claim() {} };
	vm.runInNewContext(readFileSync("public/sw.js", "utf8"), ctx);

	async function navigate(path) {
		let response;
		const waits = [];
		handlers.fetch({
			request: { url: ORIGIN + path, mode: "navigate" },
			respondWith: (p) => (response = p),
			waitUntil: (p) => waits.push(p),
		});
		const res = await response;
		await Promise.all(waits);
		return res.text();
	}
	function ask(data = "update?") {
		return new Promise((resolve) => {
			handlers.message({
				data,
				source: { postMessage: resolve },
				waitUntil() {},
			});
			setTimeout(() => resolve(null), 20);
		});
	}
	return { store, navigate, ask };
}

const html = (body, headers) =>
	new Response(body, { headers: { "content-type": "text/html", ...headers } });

test("serves the cached page, then prompts once a new deploy lands", async () => {
	let build = "v1";
	const sw = loadWorker(() => html(build));

	assert.equal(await sw.navigate("/"), "v1");
	sw.store.set(`${ORIGIN}/_next/static/old.js`, new Response("old"));

	build = "v2";
	assert.equal(await sw.navigate("/"), "v1", "stale page served at once");
	assert.equal(await sw.ask(), "update-ready");
	assert.ok(
		!sw.store.has(`${ORIGIN}/_next/static/old.js`),
		"old build dropped",
	);

	assert.equal(await sw.navigate("/"), "v2");
	assert.equal(await sw.ask(), null, "no prompt when nothing changed");
});

test("never caches the login page the proxy rewrites in", async () => {
	const sw = loadWorker(() =>
		html("login", { "x-middleware-rewrite": "/login" }),
	);
	assert.equal(await sw.navigate("/"), "login");
	assert.ok(!sw.store.has(`${ORIGIN}/`));
});

test("finds a deploy that lands while the app is open", async () => {
	let build = "v1";
	const sw = loadWorker(() => html(build));
	await sw.navigate("/");
	await sw.navigate("/low");

	build = "v2";
	assert.equal(await sw.ask({ check: "/" }), "update-ready");
	assert.equal(await sw.navigate("/"), "v2", "Reload gets the new build");
	assert.ok(!sw.store.has(`${ORIGIN}/low`), "old-build page dropped");
	assert.equal(await sw.ask({ check: "/" }), null);
});
