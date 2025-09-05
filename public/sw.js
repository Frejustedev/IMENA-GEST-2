// Service Worker pour IMENA-GEST
// Version: 1.0.0

const CACHE_NAME = 'imena-gest-v1';
const STATIC_CACHE = 'imena-static-v1';
const DYNAMIC_CACHE = 'imena-dynamic-v1';

// Assets statiques à mettre en cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Mise en cache des assets statiques');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== STATIC_CACHE && 
                   cacheName !== DYNAMIC_CACHE &&
                   cacheName.startsWith('imena-');
          })
          .map((cacheName) => {
            console.log('[SW] Suppression du cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  return self.clients.claim();
});

// Stratégies de mise en cache
const cacheStrategies = {
  // Cache First pour les assets statiques
  cacheFirst: async (request) => {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await fetch(request);
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      return response;
    } catch (error) {
      return caches.match('/offline.html');
    }
  },
  
  // Network First pour l'API
  networkFirst: async (request) => {
    try {
      const response = await fetch(request);
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      return cached || new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Mode hors ligne - Données mises en cache' 
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
  
  // Stale While Revalidate pour les images
  staleWhileRevalidate: async (request) => {
    const cached = await caches.match(request);
    
    const fetchPromise = fetch(request).then(async (response) => {
      // Cloner la response AVANT de l'utiliser
      const responseToCache = response.clone();
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, responseToCache);
      return response;
    });
    
    return cached || fetchPromise;
  }
};

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-HTTP
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Stratégies selon le type de ressource
  if (request.method === 'GET') {
    // API calls
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(cacheStrategies.networkFirst(request));
    }
    // Images
    else if (request.destination === 'image') {
      event.respondWith(cacheStrategies.staleWhileRevalidate(request));
    }
    // Autres assets statiques
    else {
      event.respondWith(cacheStrategies.cacheFirst(request));
    }
  }
});

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('[SW] Synchronisation:', event.tag);
  
  if (event.tag === 'sync-patients') {
    event.waitUntil(syncPatients());
  }
});

// Synchroniser les données patients
async function syncPatients() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    const patientRequests = requests.filter(req => 
      req.url.includes('/api/v1/patients')
    );
    
    for (const request of patientRequests) {
      try {
        const response = await fetch(request);
        await cache.put(request, response);
      } catch (error) {
        console.error('[SW] Erreur sync:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Erreur sync patients:', error);
  }
}

// Notifications push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification IMENA-GEST',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'Voir',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('IMENA-GEST', options)
  );
});

// Gestion des clics sur notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message depuis l'application
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
