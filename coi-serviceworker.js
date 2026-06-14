/*! coi-serviceworker v0.1.7 - Guido Zuidhof and contributors, licensed under MIT */
let coepCredentialless = false;

if (typeof window === 'undefined') {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener('message', (event) => {
    if (!event.data) {
      return;
    }

    if (event.data.type === 'deregister') {
      self.registration
        .unregister()
        .then(() => self.clients.matchAll())
        .then((clients) => {
          clients.forEach((client) => client.navigate(client.url));
        });
    } else if (event.data.type === 'coepCredentialless') {
      coepCredentialless = event.data.value;
    }
  });

  self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
      return;
    }

    const isolatedRequest = coepCredentialless && request.mode === 'no-cors'
      ? new Request(request, { credentials: 'omit' })
      : request;

    event.respondWith(
      fetch(isolatedRequest)
        .then((response) => {
          if (response.status === 0) {
            return response;
          }

          const headers = new Headers(response.headers);
          headers.set(
            'Cross-Origin-Embedder-Policy',
            coepCredentialless ? 'credentialless' : 'require-corp'
          );

          if (!coepCredentialless) {
            headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
          }

          headers.set('Cross-Origin-Opener-Policy', 'same-origin');

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
          });
        })
        .catch((error) => console.error(error))
    );
  });
} else {
  (() => {
    // You can customize the behavior of this script through a global `coi` variable.
    const coi = {
      shouldRegister: () => true,
      shouldDeregister: () => false,
      coepCredentialless: () => false,
      doReload: () => window.location.reload(),
      quiet: false,
      ...window.coi
    };

    const navigatorRef = navigator;

    if (navigatorRef.serviceWorker && navigatorRef.serviceWorker.controller) {
      navigatorRef.serviceWorker.controller.postMessage({
        type: 'coepCredentialless',
        value: coi.coepCredentialless()
      });

      if (coi.shouldDeregister()) {
        navigatorRef.serviceWorker.controller.postMessage({ type: 'deregister' });
      }
    }

    // If we're already cross-origin isolated, do nothing. Perhaps this script is
    // doing its job, or COOP/COEP are already set by the origin server. If the
    // browser has no notion of crossOriginIsolated, give up here as well.
    if (window.crossOriginIsolated !== false || !coi.shouldRegister()) {
      return;
    }

    if (!window.isSecureContext) {
      !coi.quiet && console.log('COOP/COEP Service Worker not registered, a secure context is required.');
      return;
    }

    // In some environments, such as private browsing, service workers are not available.
    if (navigatorRef.serviceWorker) {
      navigatorRef.serviceWorker.register(window.document.currentScript.src).then(
        (registration) => {
          !coi.quiet && console.log('COOP/COEP Service Worker registered', registration.scope);

          registration.addEventListener('updatefound', () => {
            !coi.quiet && console.log('Reloading page to make use of updated COOP/COEP Service Worker.');
            coi.doReload();
          });

          // If the registration is active but it is not yet controlling the page,
          // reload so future requests go through the COOP/COEP service worker.
          if (registration.active && !navigatorRef.serviceWorker.controller) {
            !coi.quiet && console.log('Reloading page to make use of COOP/COEP Service Worker.');
            coi.doReload();
          }
        },
        (error) => {
          !coi.quiet && console.error('COOP/COEP Service Worker failed to register:', error);
        }
      );
    }
  })();
}
