/* sw.js — Service Worker: cache offline para PWA */

const CACHE = 'sistemaAT-v1';
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/banco.js',
  './js/ui.js',
  './js/criancas.js',
  './js/atendimentos.js',
  './js/historicos.js',
  './js/resumos.js',
  './js/devolutivas.js',
  './js/relatorios.js',
  './js/backup.js',
  './js/configuracoes.js',
  './js/ajuda.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(
      // Ignora falhas em recursos externos (fontes)
      ARQUIVOS.map(url => new Request(url, { cache: 'reload' }))
    )).catch(() => caches.open(CACHE).then(cache =>
      // Se falhar com reload, tenta sem forçar
      cache.addAll(ARQUIVOS.filter(u => !u.startsWith('http')))
    ))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Só intercepta GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        // Armazena no cache apenas respostas válidas do próprio domínio
        if (resp && resp.status === 200 && resp.type !== 'opaque') {
          const clone = resp.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});
