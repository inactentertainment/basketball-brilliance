// Mount once, after the role's article content is in place.
export async function mountArticleComfort(){
 if(document.getElementById('page-tools'))return;
 document.body.dataset.reader='true';
 const bar=document.createElement('aside');bar.id='page-tools';bar.setAttribute('aria-label','Basketball Brilliance Reading & Comfort Bar');
 bar.innerHTML='<button class="light-toggle" type="button"></button><div class="reader-utilities"></div><div class="reader-right"></div>';
 document.body.append(bar);
 const load=src=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.head.append(script)});
 try{await load('assets/read-aloud.js?v=60');await load('assets/reader-comfort.js?v=60');
 const tip=document.createElement('div');tip.className='ie-tooltip';tip.hidden=true;tip.id='bb-reader-tooltip';document.body.append(tip);
 bar.querySelectorAll('[data-tooltip]').forEach(button=>{
  button.title=button.dataset.tooltip;
  const show=()=>{tip.textContent=button.dataset.tooltip;tip.hidden=false;const r=button.getBoundingClientRect();tip.style.left=Math.max(8,Math.min(innerWidth-150,r.left-35))+'px';tip.style.bottom=(innerHeight-r.top+8)+'px';};
  const hide=()=>{tip.hidden=true;};button.addEventListener('pointerenter',show);button.addEventListener('focus',show);button.addEventListener('pointerleave',hide);button.addEventListener('blur',hide);button.addEventListener('click',hide);
 });}catch{bar.textContent='Reading tools could not load. Please refresh this page.';}
}
