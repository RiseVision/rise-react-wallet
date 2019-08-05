// tslint:disable:no-console
// In production, we register a service worker to serve assets from local cache.

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on the 'N+1' visit to a page, since previously
// cached resources are updated in the background.

// To learn more about the benefits of this model, read https://goo.gl/KwvDNy.
// This link also includes instructions on opting out of this behavior.

import { runInAction } from 'mobx';
import RootStore from './stores/root';

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.1/8 is considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

export function register(store: RootStore) {
  if (
    process.env.NODE_ENV !== 'production' ||
    !('serviceWorker' in navigator)
  ) {
    return;
  }
  // The URL constructor is available in all browsers that support SW.
  const publicUrl = new URL(
    // process.env.PUBLIC_URL!,
    window.location.toString()
  );
  if (publicUrl.origin !== window.location.origin) {
    // Our service worker won't work if PUBLIC_URL is on a different origin
    // from what our page is served on. This might happen if a CDN is used to
    // serve assets; see https://github.com/facebookincubator/create-react-app/issues/2374
    return;
  }

  window.addEventListener('load', () => {
    // const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
    const swUrl = `/service-worker.js`;

    if (!isLocalhost) {
      // Is not local host. Just register service worker
      registerValidSW(store, swUrl);
    } else {
      // This is running on localhost. Lets check if a service worker still exists or not.
      checkValidServiceWorker(store, swUrl);
    }
  });
}

async function registerValidSW(store: RootStore, swUrl: string) {
  try {
    const registration = await navigator.serviceWorker.register(swUrl);
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (!installingWorker) {
        return;
      }
      installingWorker.onstatechange = () => {
        if (installingWorker.state !== 'installed') {
          return;
        }
        if (navigator.serviceWorker.controller) {
          // At this point, the old content will have been purged and
          // the fresh content will have been added to the cache.
          // It's the perfect time to display a 'New content is
          // available; please refresh.' message in your web app.
          runInAction(() => {
            store.updateAvailable = true;
          });
          console.log('New content is available; please refresh.');
        } else {
          // At this point, everything has been precached.
          // It's the perfect time to display a
          // 'Content is cached for offline use.' message.
          console.log('Content is cached for offline use.');
        }
      };
    };
  } catch (error) {
    console.error('Error during service worker registration:', error);
  }
}

async function checkValidServiceWorker(store: RootStore, swUrl: string) {
  // Check if the service worker can be found. If it can't reload the page.
  try {
    const response = await fetch(swUrl);
    // Ensure service worker exists, and that we really are getting a JS file.
    if (
      response.status === 404 ||
      response.headers.get('content-type')!.indexOf('javascript') === -1
    ) {
      // No service worker found. Probably a different app. Reload the page.
      const registration = await navigator.serviceWorker.ready
      await registration.unregister()
      window.location.reload();
    } else {
      // Service worker found. Proceed as normal.
      registerValidSW(store, swUrl);
    }
  } catch {
    console.log(
      'No internet connection found. App is running in offline mode.'
    );
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister();
    });
  }
}
