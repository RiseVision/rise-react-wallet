/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "assets/a2hs-ios.png",
    "revision": "fcdb9ec64b49a34842d1618758cdbea4"
  },
  {
    "url": "assets/favicon.ico",
    "revision": "d19bcb9a4a5f04e72693f27a4ec7ea8a"
  },
  {
    "url": "assets/icon-16.png",
    "revision": "c4f9fb02a8cfdccb376c8f2d9b0a1e6f"
  },
  {
    "url": "assets/icon-180.png",
    "revision": "1c340da91c70d4ec10cf379e92e5c61f"
  },
  {
    "url": "assets/icon-192.png",
    "revision": "4d63785ff63aca0fb2846e5a0c61a732"
  },
  {
    "url": "assets/icon-24.png",
    "revision": "009e7a5b9c99f43159bf76224ebac9ca"
  },
  {
    "url": "assets/icon-270.png",
    "revision": "fc56c688deda2665b07573abe1d85415"
  },
  {
    "url": "assets/icon-32.png",
    "revision": "0eda784612e7f0a536c161a0e5f84df6"
  },
  {
    "url": "assets/icon-64.png",
    "revision": "f42dcd0f044e4e92e45168ece7b687cb"
  },
  {
    "url": "et.e9a31d22.js",
    "revision": "155c1587c11f14fe5fb7c75f60ed6257"
  },
  {
    "url": "favicon.583c23b4.ico",
    "revision": "d19bcb9a4a5f04e72693f27a4ec7ea8a"
  },
  {
    "url": "fr.e5d3f8f1.js",
    "revision": "110bf2385c41838f347fdd358b027147"
  },
  {
    "url": "icon-180.77623cf0.png",
    "revision": "1c340da91c70d4ec10cf379e92e5c61f"
  },
  {
    "url": "icon-192.fd33cd02.png",
    "revision": "4d63785ff63aca0fb2846e5a0c61a732"
  },
  {
    "url": "icon-270.99dc3e8c.png",
    "revision": "fc56c688deda2665b07573abe1d85415"
  },
  {
    "url": "index.html",
    "revision": "37ec0da8b47971bc09765c9c1c4f5f36"
  },
  {
    "url": "nl.e5ec29e9.js",
    "revision": "0d5803f7abd119885e4336b7f25a4aec"
  },
  {
    "url": "onboarding.ec67fdb1.js",
    "revision": "d77adf2761635be4c6271395b55bdb20"
  },
  {
    "url": "pl.60b854c7.js",
    "revision": "9147647371e4d2dbcec4edd9e6cdd201"
  },
  {
    "url": "src.0285ebfb.js",
    "revision": "a3b8b049f69ff121bd3156e97d8bed45"
  },
  {
    "url": "wallet.23008219.js",
    "revision": "7baf0c0b40a24abb3b0d0db37acdfbd8"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
