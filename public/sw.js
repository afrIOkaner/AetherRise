/**
 * @file sw.js
 * @description Manual Service Worker for AetherRise.
 * Handles Offline Caching and Installation.
 */

const CACHE_NAME = "aether-v1";
const ASSETS_TO_CACHE = [
    "/",
    "/manifest.json",
    "/icon-192x192.png",
    "/icon-512x512.png",
    "/offline" // Optional: an offline fallback page
];

// 1. Installation: Cache the basic assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Aether Cache: Pre-caching assets");
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Activation: Clean up old versions of the cache
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});

// 3. Fetching: Serve from cache if offline
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
