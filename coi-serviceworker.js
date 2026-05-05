/*! coi-serviceworker v0.1.7 | MIT License | https://github.com/gzuidhof/coi-serviceworker */
if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener("fetch", (event) => {
        if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") {
            return;
        }

        event.respondWith(
            fetch(event.request).then((response) => {
                if (response.status === 0) {
                    return response;
                }

                const newHeaders = new Headers(response.headers);
                newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
                newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: newHeaders,
                });
            }).catch(e => {
                return fetch(event.request);
            })
        );
    });
} else {
    (() => {
        // If already isolated, we're done.
        if (window.crossOriginIsolated) return;

        // Loop protection for mobile browsers
        const COI_RELOAD_KEY = 'coi_reload_count';
        const reloadCount = parseInt(sessionStorage.getItem(COI_RELOAD_KEY) || '0');

        if (reloadCount > 3) {
            console.error("COI: Too many reloads. Browser might not support WASM headers.");
            return;
        }

        const script = document.currentScript;
        const src = script ? script.src : "coi-serviceworker.js";

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register(src).then((registration) => {
                registration.addEventListener("updatefound", () => {
                    const newValue = registration.installing;
                    newValue.addEventListener("statechange", () => {
                        if (newValue.state === "activated") {
                            sessionStorage.setItem(COI_RELOAD_KEY, (reloadCount + 1).toString());
                            window.location.reload();
                        }
                    });
                });

                // Check if active but not isolated
                if (registration.active && !window.crossOriginIsolated) {
                    sessionStorage.setItem(COI_RELOAD_KEY, (reloadCount + 1).toString());
                    window.location.reload();
                }
            });
        }
    })();
}
