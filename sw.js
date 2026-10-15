const CACHE='basketball-brilliance-v61';
const CORE=['./index.html','./manifest.webmanifest','./assets/basketball-brilliance-header.gif','./assets/dmv-ballin.mp3','./assets/js/bb-config.js','./assets/js/bb-auth.js?v=61','./assets/js/bb-data.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('basketball-brilliance-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);
 // Never retain account records, authenticated requests, Stripe, or external APIs.
 if(url.origin!==self.location.origin||e.request.headers.has('authorization')||e.request.headers.has('range'))return;
 if(e.request.mode==='navigate'){
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(async res=>{if(res.ok&&/\/(?:index\.html)?$/.test(url.pathname)){const copy=res.clone();e.waitUntil(caches.open(CACHE).then(cache=>cache.put('./index.html',copy)));}return res;}).catch(()=>caches.match('./index.html')));
  return;
 }
 if(!/\/(?:assets|app-assets)\//.test(url.pathname)&&!url.pathname.endsWith('/manifest.webmanifest'))return;
 e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{if(res.ok&&res.status!==206){const copy=res.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)));}return res;})));
});
