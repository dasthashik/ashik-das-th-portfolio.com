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

        // URL-based loop protection (more reliable for mobile)
        const url = new URL(window.location.href);
        if (url.searchParams.has('coi-ok')) return;

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register(window.document.currentScript.src).then((registration) => {
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
