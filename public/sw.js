// Feral Friends Service Worker
// Advanced caching strategies optimized for game assets and offline functionality

const CACHE_NAME = 'feral-friends-v1';
const STATIC_CACHE = 'feral-friends-static-v1';
const DYNAMIC_CACHE = 'feral-friends-dynamic-v1';
const IMAGE_CACHE = 'feral-friends-images-v1';
const API_CACHE = 'feral-friends-api-v1';

// Files to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add core assets that should always be available
];

// Routes that should be cached with network-first strategy
const DYNAMIC_ROUTES = [
  '/game',
  '/settings',
  '/help'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/animals',
  '/api/maps',
  '/api/save'
];

// Maximum cache sizes
const CACHE_LIMITS = {
  [STATIC_CACHE]: 50,
  [DYNAMIC_CACHE]: 30,
  [IMAGE_CACHE]: 100,
  [API_CACHE]: 20
};

// Cache expiration times (in milliseconds)
const CACHE_EXPIRY = {
  [STATIC_CACHE]: 7 * 24 * 60 * 60 * 1000, // 7 days
  [DYNAMIC_CACHE]: 24 * 60 * 60 * 1000,    // 1 day
  [IMAGE_CACHE]: 30 * 24 * 60 * 60 * 1000, // 30 days
  [API_CACHE]: 60 * 60 * 1000               // 1 hour
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('SW: Installing service worker');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.addAll(STATIC_ASSETS);
        console.log('SW: Static assets cached');
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('SW: Failed to cache static assets:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating service worker');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.startsWith('feral-friends-') && !Object.values({
            STATIC_CACHE,
            DYNAMIC_CACHE,
            IMAGE_CACHE,
            API_CACHE
          }).includes(name)
        );
        
        await Promise.all(
          oldCaches.map(cacheName => {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
        
        // Take control of all clients
        await self.clients.claim();
        console.log('SW: Service worker activated');
      } catch (error) {
        console.error('SW: Failed to activate:', error);
      }
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Route to appropriate caching strategy
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
  } else if (isAPIRequest(url)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (isDynamicRoute(url)) {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
  } else {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'feral-friends',
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Caching Strategies

// Cache First - for static assets and images
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, cacheName)) {
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(cache, cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('SW: Cache first strategy failed:', error);
    
    // Return cached version if available, even if expired
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    return createOfflineFallback(request);
  }
}

// Network First - for dynamic content and API calls
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(cache, cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('SW: Network failed, trying cache:', error.message);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    return createOfflineFallback(request);
  }
}

// Helper Functions

function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|woff2?|ttf|eot|ico)$/) ||
         url.pathname === '/' ||
         url.pathname === '/index.html' ||
         url.pathname === '/manifest.json';
}

function isImageRequest(url) {
  return url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/);
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') ||
         API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint));
}

function isDynamicRoute(url) {
  return DYNAMIC_ROUTES.some(route => url.pathname.startsWith(route));
}

function isExpired(response, cacheName) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const cacheDate = new Date(dateHeader);
  const now = new Date();
  const expiryTime = CACHE_EXPIRY[cacheName] || CACHE_EXPIRY[DYNAMIC_CACHE];
  
  return (now - cacheDate) > expiryTime;
}

async function limitCacheSize(cache, cacheName) {
  const limit = CACHE_LIMITS[cacheName] || 50;
  const keys = await cache.keys();
  
  if (keys.length > limit) {
    // Remove oldest entries (FIFO)
    const keysToDelete = keys.slice(0, keys.length - limit);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

function createOfflineFallback(request) {
  const url = new URL(request.url);
  
  if (request.headers.get('accept')?.includes('text/html')) {
    // Return offline page for HTML requests
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Feral Friends - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; }
            .offline-message { max-width: 400px; margin: 0 auto; }
            .icon { font-size: 4rem; color: #6b7280; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <div class="icon">🦊</div>
            <h1>You're Offline</h1>
            <p>Feral Friends works offline! Your progress is saved locally and will sync when you're back online.</p>
            <button onclick="location.reload()">Try Again</button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  if (isImageRequest(url)) {
    // Return placeholder for missing images
    return new Response('', {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
  
  if (isAPIRequest(url)) {
    // Return empty response for API calls
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      message: 'API not available offline' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Default fallback
  return new Response('Offline', { status: 503 });
}

async function handleBackgroundSync() {
  try {
    console.log('SW: Handling background sync');
    
    // Get pending sync data from IndexedDB
    const db = await openIndexedDB();
    const syncData = await getSyncData(db);
    
    if (syncData.length > 0) {
      console.log(`SW: Found ${syncData.length} items to sync`);
      
      // Attempt to sync each item
      for (const item of syncData) {
        try {
          await syncItem(item);
          await removeSyncItem(db, item.id);
        } catch (error) {
          console.error('SW: Failed to sync item:', error);
        }
      }
    }
  } catch (error) {
    console.error('SW: Background sync failed:', error);
  }
}

async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FeralFriendsSync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sync')) {
        db.createObjectStore('sync', { keyPath: 'id' });
      }
    };
  });
}

async function getSyncData(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sync'], 'readonly');
    const store = transaction.objectStore('sync');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function syncItem(item) {
  const response = await fetch(item.url, {
    method: item.method,
    headers: item.headers,
    body: item.body
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }
  
  return response;
}

async function removeSyncItem(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sync'], 'readwrite');
    const store = transaction.objectStore('sync');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { action, data } = event.data;
  
  switch (action) {
    case 'skipWaiting':
      self.skipWaiting();
      break;
      
    case 'clearCache':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    case 'getCacheInfo':
      getCacheInfo().then((info) => {
        event.ports[0].postMessage(info);
      });
      break;
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter(name => name.startsWith('feral-friends-'))
      .map(name => caches.delete(name))
  );
}

async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const info = {};
  
  for (const name of cacheNames) {
    if (name.startsWith('feral-friends-')) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      info[name] = {
        count: keys.length,
        limit: CACHE_LIMITS[name] || 'unlimited'
      };
    }
  }
  
  return info;
}