/*! coi-serviceworker v0.1.7 | MIT License | https://github.com/gzuidhof/coi-serviceworker */
if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener("fetch", (event) => {
        if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") return;
        event.respondWith(
            fetch(event.request).then((response) => {
                if (response.status === 0) return response;
                const newHeaders = new Headers(response.headers);
                newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
                newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: newHeaders,
                });
            }).catch(() => fetch(event.request))
        );
    });
} else {
    (() => {
        if (window.crossOriginIsolated) return;

        // Strict URL-based loop protection (works best on mobile)
        const url = new URL(window.location.href);
        if (url.searchParams.has('coi-ok')) {
            console.warn("COI: Security headers failed to activate, but stopping reload to prevent loop.");
            return;
        }

        if ("serviceWorker" in navigator) {
            // Get the base path for the service worker
            const scriptSrc = document.currentScript ? document.currentScript.src : "coi-serviceworker.js";

            navigator.serviceWorker.register(scriptSrc).then((registration) => {
                const reload = () => {
                    url.searchParams.set('coi-ok', '1');
                    window.location.replace(url.href);
                };

                if (registration.active && !navigator.serviceWorker.controller) {
                    reload();
                }

                registration.addEventListener("updatefound", () => {
                    const newValue = registration.installing;
                    newValue.addEventListener("statechange", () => {
                        if (newValue.state === "activated") reload();
                    });
                });
            });
        }
    })();
}
