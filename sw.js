const CACHE='basketball-brilliance-v45-portal-video-rows';
const CORE=['./manifest.webmanifest','./assets/basketball-brilliance-header.gif','./assets/dmv-ballin.mp3','./assets/js/bb-config.js','./assets/js/bb-auth.js','./assets/js/bb-data.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('basketball-brilliance-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 if(e.request.mode==='navigate'){
   e.respondWith(fetch(e.request,{cache:'no-store'}).then(res=>res).catch(()=>caches.match('./index.html')));
   return;
 }
 e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res})));
});