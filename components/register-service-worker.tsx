"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
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
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // A home-screen relaunch resumes from bfcache instead of navigating, so
    // the browser never checks sw.js for updates on its own. Ask it to.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) registration?.update();
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
