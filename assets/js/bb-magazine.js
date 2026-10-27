/* Basketball Brilliance magazine invitation: prepared only; disabled until approved title and verified subscription delivery. */
(()=>{'use strict';
const config=Object.freeze({
 enabled:false,
 endpoint:'',
 title:'Basketball Brilliance Magazine', // Working title: confirm before final cover artwork.
 signupType:'magazine_subscription',
 consent:'I agree to receive Basketball Brilliance magazine updates and occasional promotional emails. I understand that I can unsubscribe at any time.'
});
window.BBMagazineSettings=config;
if(!config.enabled||!/^https:\/\//.test(config.endpoint))return;
const portal=()=>String(document.body.dataset.portal||'').toLowerCase();
const relevant=()=>['coach','player','parent'].includes(portal());
const completed=()=>{try{return localStorage.getItem('bb-magazine-completed-v1')==='1'}catch{return false}};
const shown=()=>{try{return sessionStorage.getItem('bb-magazine-shown-v1')==='1'}catch{return false}};
const busy=()=>!!document.querySelector('.modal.open,#bbFreeGiftModal.open,[role="dialog"][aria-modal="true"].open,[data-bb-focused-task="true"],[data-checkout-active="true"],audio:not([paused]),video:not([paused])')||!!document.activeElement?.closest('input,textarea,select,[contenteditable="true"]');
const css=document.createElement('style');
css.textContent=`
#bbMagazineModal{display:none;position:fixed;inset:0;z-index:95;background:#000c;padding:16px;place-items:center}
#bbMagazineModal.open{display:grid}
#bbMagazineModal .mag-shell{position:relative;background:radial-gradient(circle at 10% 5%,#3e241b,#181a1d 55%,#070809);border:1px solid #62422e;color:#fff;width:min(820px,96vw);border-radius:24px;max-height:92dvh;overflow:auto;padding:clamp(20px,4vw,32px);box-shadow:0 26px 90px #000d}
#bbMagazineModal .mag-close{position:absolute;right:12px;top:9px;border:0;background:transparent;color:#fff;cursor:pointer;padding:9px;font-size:27px}
#bbMagazineModal .mag-columns{display:grid;grid-template-columns: minmax(210px,.88fr) 1.12fr;gap:clamp(16px,4vw,38px);align-items:center}
#bbMagazineModal .mag-cover{position:relative;isolation:isolate;aspect-ratio:8.5/11;max-width:290px;width:100%;margin:6px auto 18px;background:linear-gradient(145deg,#121419 0%,#383e48 40%,#101318 75%);border:1px solid #81858b;box-shadow:10px 9px 1px #45484b,17px 20px 25px #0009;transform:rotate(-3deg);padding:15px;overflow:hidden}
#bbMagazineModal .mag-cover:before{content:'';position:absolute;inset:32% -10% 8%;border-radius:50%;background:radial-gradient(circle at center,#df581e55,transparent 65%);pointer-events:none}
#bbMagazineModal .mag-mast{position:relative;z-index:1;text-align:center;color:#fff;font-weight:1000;font-size:clamp(23px,4vw,32px);line-height:.9;letter-spacing:-.06em;text-shadow:2px 2px #111}
#bbMagazineModal .mag-mast strong{display:block;color:#f15a29}
#bbMagazineModal .mag-edition{position:relative;text-align:center;color:#ffb38d;font-weight:800;letter-spacing:.12em;font-size:10px;margin-top:12px}
#bbMagazineModal .mag-ball{position:absolute;left:50%;top:47%;transform:translate(-50%,-32%) rotate(-20deg);width:66%;aspect-ratio:1;border-radius:50%;border:7px solid #16191c;background:radial-gradient(circle at 31% 23%,#ffac62,#c64e1c 65%,#692506);box-shadow:0 15px 30px #000b,inset -14px -13px 18px #0006}
#bbMagazineModal .mag-ball:before{content:'';position:absolute;inset:0 45%;border-left:5px solid #1b1a1a;border-right:5px solid #1b1a1a;border-radius:45%}
#bbMagazineModal .mag-ball:after{content:'';position:absolute;left:0;right:0;top:45%;border-top:5px solid #1b1a1a;transform:rotate(16deg)}
#bbMagazineModal .mag-headline{position:absolute;bottom:12%;left:10px;right:10px;text-align:center;font-size:20px;line-height:1.03;font-weight:950;letter-spacing:.01em;text-shadow:0 2px 5px #000}
#bbMagazineModal .mag-sample{font-size:9px;position:absolute;bottom:7px;left:12px;color:#ccc;letter-spacing:.1em}
#bbMagazineModal .mag-brand{display:flex;align-items:center;gap:12px;color:#ffad81;font-weight:900;font-size:12px;letter-spacing:.12em;text-transform:uppercase}
#bbMagazineModal .mag-brand img{width:48px;height:48px;object-fit:contain}
#bbMagazineModal h2{font-size:clamp(27px,4vw,37px);line-height:1.1;margin:14px 0}
#bbMagazineModal p{color:#d1d3d7;line-height:1.5;font-size:14px}
#bbMagazineModal label{display:block;margin:13px 0 4px;font-size:12px;font-weight:800}
#bbMagazineModal input[type=text],#bbMagazineModal input[type=email]{width:100%;padding:12px;background:#0a0b0d;color:#fff;border:1px solid #777;border-radius:10px;margin-top:5px}
#bbMagazineModal .mag-check{display:flex;align-items:flex-start;gap:9px;line-height:1.45;font-size:12px;font-weight:500}
#bbMagazineModal .mag-check input{margin-top:3px;flex:none;accent-color:#ee632b}
#bbMagazineModal button[type=submit]{background:linear-gradient(110deg,#ae380f,#ef5c2c,#ff803d);color:#fff;border:0;border-radius:12px;width:100%;padding:14px;font-weight:900;margin-top:12px;cursor:pointer}
#bbMagazineModal button:disabled{opacity:.55}
#bbMagazineModal #bbMagazineStatus{min-height:20px;font-size:12px}
@media(max-width:630px){#bbMagazineModal .mag-columns{grid-template-columns:1fr}#bbMagazineModal .mag-cover{max-width:185px}#bbMagazineModal .mag-shell{max-height:94dvh}#bbMagazineModal .mag-headline{font-size:14px}}
`;document.head.append(css);
const modal=document.createElement('div');modal.id='bbMagazineModal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','bbMagazineTitle');
modal.innerHTML=`<div class="mag-shell"><button class="mag-close" type="button" aria-label="Close magazine invitation">×</button><div class="mag-columns"><div><div class="mag-cover" aria-label="Illustrative magazine cover, not an available issue"><div class="mag-mast">BASKETBALL<strong>BRILLIANCE</strong></div><div class="mag-edition">IN SEASON / OFF SEASON</div><div class="mag-ball"></div><div class="mag-headline">THE GAME.<br>THE GROWTH.<br>THE JOURNEY.</div><div class="mag-sample">COVER CONCEPT • NO ISSUE RELEASED</div></div></div><div><div class="mag-brand"><img src="assets/bb-fire-logo.webp" alt=""> Basketball Brilliance</div><h2 id="bbMagazineTitle">Basketball Magazine Updates</h2><p>Join the list for future Basketball Brilliance magazine editions, including in-season and off-season basketball stories, learning, and development.</p><p>No issue is currently offered as an immediate download. This is a subscription invitation, not an account or membership purchase.</p><form id="bbMagazineForm"><label>Name<input name="name" type="text" maxlength="120" autocomplete="name" required></label><label>Email<input name="email" type="email" maxlength="254" autocomplete="email" required></label><label class="mag-check"><input name="consent" type="checkbox" required><span id="bbMagazineConsent"></span></label><button type="submit">Join the Magazine List</button><p id="bbMagazineStatus" role="status" aria-live="polite"></p></form></div></div></div>`;
document.body.append(modal);modal.querySelector('#bbMagazineConsent').textContent=config.consent;
let focusBefore,seconds=0,lastActivity=Date.now();
const close=()=>{modal.classList.remove('open');try{sessionStorage.setItem('bb-last-offer-dismissed',String(Date.now()))}catch{}focusBefore?.focus?.()};
modal.querySelector('.mag-close').addEventListener('click',close);
modal.addEventListener('click',e=>{if(e.target===modal)close()});
modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Tab'){const elements=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href]')].filter(x=>x.getClientRects().length);const first=elements[0],last=elements[elements.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
['pointerdown','keydown','scroll','touchstart'].forEach(type=>document.addEventListener(type,()=>{lastActivity=Date.now()},{passive:true}));
const ticker=setInterval(()=>{
 if(completed()||shown()){clearInterval(ticker);return}
 if(!relevant()||busy()||document.visibilityState!=='visible'||!document.hasFocus()||Date.now()-lastActivity>30000||Date.now()-Number(sessionStorage.getItem('bb-last-offer-dismissed')||0)<60000)return;
 seconds++;
 if(seconds<120)return;
 try{sessionStorage.setItem('bb-magazine-shown-v1','1')}catch{}
 clearInterval(ticker);focusBefore=document.activeElement;modal.classList.add('open');modal.querySelector('.mag-close').focus();
},1000);
modal.querySelector('#bbMagazineForm').addEventListener('submit',async e=>{
 e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;
 const name=form.querySelector('[name="name"]').value.trim(),email=form.querySelector('[name="email"]').value.trim(),consent=form.querySelector('[name="consent"]').checked,status=modal.querySelector('#bbMagazineStatus'),button=form.querySelector('button[type=submit]');
 if(!name||!email||!consent)return;
 button.disabled=true;status.textContent='Submitting your subscription request…';
 try{const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),15000);let response;
  try{response=await fetch(config.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brand:'Basketball Brilliance',signup_type:config.signupType,portal:portal(),name,email,consent:true,consent_wording:config.consent,source:location.href,timestamp:new Date().toISOString()}),signal:ctrl.signal})}finally{clearTimeout(timeout)}
  if(!response.ok)throw Error('Subscription request was not accepted.');
  const result=await response.json();if(result?.accepted!==true)throw Error('No acceptance confirmation.');
  try{localStorage.setItem('bb-magazine-completed-v1','1')}catch{}
  status.textContent='Your magazine subscription request has been recorded.';button.disabled=true;
 }catch(err){status.textContent='We could not confirm your request. Please try again; your information is still here.';button.disabled=false;console.warn('BB magazine:',err.message)}
});
})();
