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
                console.error("COI Fetch Error:", e);
                return fetch(event.request);
            })
        );
    });
} else {
    (() => {
        // Optimization: Don't register if we are already isolated
        if (window.crossOriginIsolated) return;

        const script = document.currentScript;
        const src = script ? script.src : "coi-serviceworker.js";

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register(src).then((registration) => {
                registration.addEventListener("updatefound", () => {
                    const newValue = registration.installing;
                    newValue.addEventListener("statechange", () => {
                        if (newValue.state === "activated") {
                            window.location.reload();
                        }
                    });
                });

                // Loop protection: If already active but not isolated, reload only once
                if (registration.active && !window.crossOriginIsolated) {
                    if (!window.sessionStorage.getItem('coi_reloaded')) {
                        window.sessionStorage.setItem('coi_reloaded', 'true');
                        window.location.reload();
                    }
                }
            });
        }
    })();
}
