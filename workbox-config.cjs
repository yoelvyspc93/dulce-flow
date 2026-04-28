module.exports = {
  globDirectory: "dist",
  globPatterns: ["**/*.{html,js,css,wasm,json,ico,png,svg}"],
  globIgnores: ["sw.js", "workbox-*.js"],
  swDest: "dist/sw.js",
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: false,
  navigateFallback: "/dulce-flow/index.html",
  navigateFallbackDenylist: [/^\/dulce-flow\/_expo\//, /^\/dulce-flow\/assets\//, /^\/dulce-flow\/.*\.[^/]+$/],
  maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.destination === "document",
      handler: "NetworkFirst",
      options: {
        cacheName: "dulce-flow-pages",
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60
        }
      }
    }
  ]
};
