/* sw.js — PWA shell. Estrategia: network-first para o HTML principal (sempre fresco),
   cache-first para assets estaticos (imagens, manifesto). */
var CACHE = 'central-4';
var STATIC = ['manifest.webmanifest', 'img/mascote.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(STATIC); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;

  var url = e.request.url;
  var isHtml = e.request.mode === 'navigate' ||
               url.endsWith('index.html') ||
               url.endsWith('/') ||
               url.indexOf('?') === -1 && url.split('/').pop().indexOf('.') === -1;

  if(isHtml){
    // Network-first: sempre busca o HTML mais recente, cai no cache só offline
    e.respondWith(
      fetch(e.request).then(function(resp){
        var copy = resp.clone();
        caches.open(CACHE).then(function(c){ try{ c.put(e.request, copy); }catch(_){} });
        return resp;
      }).catch(function(){
        return caches.match(e.request).then(function(c){ return c || caches.match('./'); });
      })
    );
  } else {
    // Cache-first para assets estaticos (imagens, manifesto)
    e.respondWith(
      caches.match(e.request).then(function(cached){
        if(cached) return cached;
        return fetch(e.request).then(function(resp){
          var copy = resp.clone();
          caches.open(CACHE).then(function(c){ try{ c.put(e.request, copy); }catch(_){} });
          return resp;
        }).catch(function(){ return caches.match('./'); });
      })
    );
  }
});
