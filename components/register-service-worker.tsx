"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/toast";

// Each check is a request to Netlify, so cap how often switching apps or
// pages can send one.
const CHECK_INTERVAL_MS = 60_000;

let prompted = false;

export function RegisterServiceWorker() {
	const pathname = usePathname();
	const lastCheck = useRef(Date.now());

	useEffect(() => {
		if (!("serviceWorker" in navigator)) return;

		// clients.claim() in sw.js makes a first-ever install fire
		// controllerchange too; only a controller *change* (this true) means a
		// deployed update actually took over, so only that should reload.
		const hadController = Boolean(navigator.serviceWorker.controller);
		let registration: ServiceWorkerRegistration | undefined;
		navigator.serviceWorker.register("/sw.js").then((reg) => {
			registration = reg;
		});

		const onControllerChange = () => {
			if (hadController) location.reload();
		};
		navigator.serviceWorker.addEventListener(
			"controllerchange",
			onControllerChange,
		);

		// A home-screen relaunch resumes from bfcache instead of navigating, so
		// the browser never checks sw.js for updates on its own. Ask it to.
		const onPageShow = (event: PageTransitionEvent) => {
			if (event.persisted) registration?.update();
		};
		window.addEventListener("pageshow", onPageShow);

		// sw.js serves a cached page and fetches the new one in the background.
		const onMessage = (event: MessageEvent) => {
			if (event.data !== "update-ready" || prompted) return;
			prompted = true;
			toast.add({
				title: "A newer version of the app is available. Reload now to update!",
				timeout: 0,
				actionProps: { children: "Reload", onClick: () => location.reload() },
			});
		};
		navigator.serviceWorker.addEventListener("message", onMessage);
		navigator.serviceWorker.startMessages();
		navigator.serviceWorker.controller?.postMessage("update?");

		// A resumed app or a long-open tab never reloads the page, so check again.
		const onVisible = () => {
			if (document.visibilityState === "visible") checkForUpdate(lastCheck);
		};
		document.addEventListener("visibilitychange", onVisible);

		return () => {
			document.removeEventListener("visibilitychange", onVisible);
			navigator.serviceWorker.removeEventListener("message", onMessage);
			navigator.serviceWorker.removeEventListener(
				"controllerchange",
				onControllerChange,
			);
			window.removeEventListener("pageshow", onPageShow);
		};
	}, []);

	// In-app navigation doesn't load a full page either.
	// biome-ignore lint/correctness/useExhaustiveDependencies: runs on each navigation
	useEffect(() => checkForUpdate(lastCheck), [pathname]);

	return null;
}

function checkForUpdate(lastCheck: { current: number }) {
	if (Date.now() - lastCheck.current < CHECK_INTERVAL_MS) return;
	lastCheck.current = Date.now();
	navigator.serviceWorker?.controller?.postMessage({
		check: location.pathname,
	});
}
