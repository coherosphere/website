import { useEffect } from 'react';

export default function ServiceWorkerManager() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Service Worker Code als String
      const serviceWorkerCode = `
// Coherosphere Service Worker
// Version 1.0.0

const CACHE_VERSION = 'coherosphere-v1';
const APP_SHELL_CACHE = \`\${CACHE_VERSION}-app-shell\`;
const RUNTIME_CACHE = \`\${CACHE_VERSION}-runtime\`;
const API_CACHE = \`\${CACHE_VERSION}-api\`;

// App Shell - kritische Dateien für Offline-Fähigkeit
const APP_SHELL_FILES = [
  '/',
  '/index.html'
];

// Install Event - Pre-Cache der App Shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(APP_SHELL_FILES);
      })
      .then(() => {
        console.log('[Service Worker] App shell cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Failed to cache app shell:', error);
      })
  );
});

// Activate Event - Cleanup alter Caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('coherosphere-') && 
                cacheName !== APP_SHELL_CACHE && 
                cacheName !== RUNTIME_CACHE && 
                cacheName !== API_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch Event - Hauptlogik für Request-Handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Nur GET-Requests cachen
  if (request.method !== 'GET') {
    return;
  }

  // API Requests - Network First mit Cache Fallback
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Statische Assets (CSS, JS, Bilder, Fonts) - Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE));
    return;
  }

  // Navigation Requests (HTML) - Network First mit Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(request, APP_SHELL_CACHE));
    return;
  }

  // Default: Network First
  event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
});

// Network First Strategy
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    if (request.mode === 'navigate') {
      const appShellResponse = await caches.match('/');
      if (appShellResponse) {
        return appShellResponse;
      }
    }
    
    throw error;
  }
}

// Cache First Strategy
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Refresh im Hintergrund (Stale While Revalidate)
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(cacheName).then((cache) => {
            cache.put(request, networkResponse);
          });
        }
      })
      .catch(() => {});
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Failed to fetch:', request.url, error);
    throw error;
  }
}

// Prüft ob eine URL ein statisches Asset ist
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.gif', '.woff', '.woff2', '.ttf', '.ico'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Message Event
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[Service Worker] Service Worker loaded successfully');
      `;

      // Erstelle Blob aus dem Service Worker Code
      const blob = new Blob([serviceWorkerCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);

      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register(swUrl)
          .then((registration) => {
            console.log('[App] Service Worker registered successfully:', registration.scope);
            
            // Check for updates periodically
            const updateInterval = setInterval(() => {
              registration.update();
            }, 60000); // Check every minute
            
            // Cleanup interval on unmount
            return () => clearInterval(updateInterval);
            
            // Listen for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[App] New service worker available, will activate on next reload');
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('[App] Service Worker registration failed:', error);
          });
      });
    } else {
      console.warn('[App] Service Workers are not supported in this browser');
    }
  }, []);

  return null; // This component doesn't render anything
}