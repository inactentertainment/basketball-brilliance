/* Basketball Brilliance free gift — Phase 2. Disabled until delivery and a real gift are verified. */
(()=>{'use strict';
const settings=Object.freeze({
 enabled:false,
 endpoint:'', // HTTPS submission endpoint. Must accept JSON and confirm saved/accepted result.
 downloadUrl:'', // Actual accessible gift URL; never advertise an unverified URL.
 title:'Free Basketball Scouting Worksheet',
 description:'A practical Player Scouting Report for evaluating skills, tracking observations, and preparing for the next game.'
});
window.BBFreeGiftSettings=settings;
if(!settings.enabled || !settings.endpoint || !settings.downloadUrl) return;
const key='bb-free-gift-completed-v1', shownKey='bb-free-gift-shown-session-v1';
const saved=()=>{try{return localStorage.getItem(key)==='1'}catch{return false}};
const wasShown=()=>{try{return sessionStorage.getItem(shownKey)==='1'}catch{return false}};
const markShown=()=>{try{sessionStorage.setItem(shownKey,'1')}catch{}};
const activeDialog=()=>!!document.querySelector('.modal.open,[role="dialog"][aria-modal="true"]');
const focused=()=>!!document.activeElement?.closest('input,textarea,select,[contenteditable="true"],[role="textbox"]');
const busy=()=>focused()||activeDialog()||!!document.querySelector('[data-bb-focused-task="true"],[data-checkout-active="true"]');
const css=document.createElement('style');css.textContent=`
#bbFreeGiftModal{position:fixed;inset:0;z-index:95;display:none;place-items:center;background:rgba(0,0,0,.79);padding:18px}
#bbFreeGiftModal.open{display:grid}
#bbFreeGiftModal .bb-gift-box{position:relative;width:min(760px,95vw);max-height:90dvh;overflow-y:auto;border:1px solid #5e473c;border-radius:24px;background:linear-gradient(155deg,#24262b,#090a0c);box-shadow:0 25px 90px #000b;padding:clamp(21px,5vw,33px);color:#f7f7f7}
#bbFreeGiftModal .bb-gift-brand{display:flex;gap:12px;align-items:center;font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#ffad88}
#bbFreeGiftModal .bb-gift-brand img{width:64px;height:64px;object-fit:contain}
#bbFreeGiftModal h2{font-size:clamp(25px,6vw,35px);line-height:1.12;margin:18px 0 9px}
#bbFreeGiftModal p{color:#c9ccd0;line-height:1.55}
#bbFreeGiftModal label{display:block;font-size:13px;font-weight:800;margin:14px 0 4px}
#bbFreeGiftModal input{display:block;width:100%;background:#0d0e10;border:1px solid #666;border-radius:11px;padding:12px;color:#fff;margin-top:6px}
#bbFreeGiftModal input:focus{outline:2px solid #ff8b56;outline-offset:2px}
#bbFreeGiftModal .bb-gift-btn{display:block;width:100%;margin-top:20px;border:0;border-radius:12px;padding:13px 20px;background:linear-gradient(115deg,#af390e,#f15a29,#ff8444);font-weight:900;color:#fff;cursor:pointer}
#bbFreeGiftModal .bb-gift-btn:disabled{opacity:.65;cursor:wait}
#bbFreeGiftModal .bb-gift-x{position:absolute;right:13px;top:11px;cursor:pointer;background:transparent;border:0;color:#fff;font-size:27px;line-height:1;padding:8px}
#bbFreeGiftModal [role="status"]{min-height:20px;margin-top:12px;font-size:13px}
#bbFreeGiftModal .bb-gift-foot{font-size:11px;color:#aeb2b7}
`;document.head.append(css);
css.textContent+=`
#bbFreeGiftModal .bb-gift-layout{display:grid;grid-template-columns:minmax(205px,.9fr) 1.1fr;gap:26px;align-items:center}
#bbFreeGiftModal .bb-gift-sample{min-width:0;text-align:center}
#bbFreeGiftModal .bb-gift-sample small{font-size:10px;color:#aeb2b7}
#bbFreeGiftModal .bb-gift-paper{margin:18px auto;background:#fff;color:#151515;text-align:left;border-radius:3px;border-top:7px solid #f15a29;padding:16px 13px;box-shadow:8px 9px 0 #d0d0d0,15px 17px 26px #0009;transform:rotate(-3deg);font-family:Arial,sans-serif}
#bbFreeGiftModal .bb-paper-brand{font-size:10px;font-style:italic;font-weight:950;letter-spacing:-.04em}.bb-gift-paper .bb-paper-brand strong{color:#db4b1a}
#bbFreeGiftModal .bb-paper-title{font-size:15px;font-weight:950;margin:12px 0;border-bottom:2px solid #191919;padding-bottom:7px}
#bbFreeGiftModal .bb-paper-line{font-size:10px;margin:9px 0}
#bbFreeGiftModal .bb-gift-paper table{width:100%;font-size:10px;border-collapse:collapse;margin-top:12px}
#bbFreeGiftModal .bb-gift-paper th{background:#e55b25;color:#fff}
#bbFreeGiftModal .bb-gift-paper th,#bbFreeGiftModal .bb-gift-paper td{padding:5px 4px;border:1px solid #bbb}
#bbFreeGiftModal .bb-paper-note{background:#e55b25;color:#fff;font-size:10px;font-weight:900;padding:5px;margin-top:12px}
@media(max-width:650px){#bbFreeGiftModal .bb-gift-layout{grid-template-columns:1fr;gap:8px}#bbFreeGiftModal .bb-gift-paper{width:min(225px,80%);margin:12px auto;font-size:9px}#bbFreeGiftModal .bb-gift-sample small{font-size:9px}#bbFreeGiftModal .bb-gift-box{max-height:91dvh}#bbFreeGiftModal .bb-gift-brand img{width:42px;height:42px}}
`;
const dialog=document.createElement('div');dialog.id='bbFreeGiftModal';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','bbGiftHeading');
dialog.innerHTML=`<div class="bb-gift-box"><button type="button" class="bb-gift-x" aria-label="Close free gift invitation">×</button><div class="bb-gift-brand"><img src="assets/bb-fire-logo.webp" alt=""> Basketball Brilliance</div><div class="bb-gift-layout"><div class="bb-gift-sample" aria-label="Preview of a player scouting report worksheet"><div class="bb-gift-paper"><div class="bb-paper-brand">BASKETBALL <strong>BRILLIANCE</strong></div><div class="bb-paper-title">PLAYER SCOUTING REPORT</div><div class="bb-paper-line">Player: _____________________</div><div class="bb-paper-line">Team: ______________________</div><div class="bb-paper-line">Game / Date: ________________</div><table aria-hidden="true"><thead><tr><th>SKILL</th><th>1–5</th><th>NOTES</th></tr></thead><tbody><tr><td>Shooting</td><td>□ □ □</td><td>________</td></tr><tr><td>Ball handling</td><td>□ □ □</td><td>________</td></tr><tr><td>Passing</td><td>□ □ □</td><td>________</td></tr><tr><td>Defense</td><td>□ □ □</td><td>________</td></tr><tr><td>Rebounding</td><td>□ □ □</td><td>________</td></tr><tr><td>Effort</td><td>□ □ □</td><td>________</td></tr></tbody></table><div class="bb-paper-note">KEY OBSERVATIONS</div><div class="bb-paper-line">_________________________</div><div class="bb-paper-line">_________________________</div></div><small>Worksheet design preview · Not yet available for download</small></div><div class="bb-gift-content"><h2 id="bbGiftHeading"></h2><p id="bbGiftDescription"></p><form id="bbGiftForm"><label for="bbGiftName">Your name<input id="bbGiftName" name="name" autocomplete="name" maxlength="120" required></label><label for="bbGiftEmail">Your email<input id="bbGiftEmail" name="email" type="email" autocomplete="email" maxlength="254" required></label><button class="bb-gift-btn" type="submit">Request My Free Resource</button><div role="status" aria-live="polite" id="bbGiftStatus"></div></form><p class="bb-gift-foot">This request is for the free resource only. You are not subscribing to a magazine or promotional emails.</p><div id="bbGiftReady" hidden><p>Your request was accepted. Your download is ready.</p><a class="bb-gift-btn" id="bbGiftLink" rel="noopener" target="_blank">Open the Download</a></div></div></div>`;
document.body.append(dialog);
dialog.querySelector('#bbGiftHeading').textContent=settings.title;
dialog.querySelector('#bbGiftDescription').textContent=settings.description;
let previousFocus=null,seconds=0,hadInput=Date.now();
const close=()=>{dialog.classList.remove('open');previousFocus?.focus?.()};
dialog.querySelector('.bb-gift-x').addEventListener('click',close);
dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close()}});
['pointerdown','keydown','scroll','touchstart'].forEach(type=>document.addEventListener(type,()=>{hadInput=Date.now()},{passive:true}));
const timer=setInterval(()=>{
 if(saved()||wasShown()){clearInterval(timer);return}
 if(document.visibilityState!=='visible'||!document.hasFocus()||busy()||Date.now()-hadInput>30000)return;
 seconds+=1;
 if(seconds<25)return;
 markShown();clearInterval(timer);previousFocus=document.activeElement;dialog.classList.add('open');dialog.querySelector('.bb-gift-x').focus();
},1000);
dialog.querySelector('#bbGiftForm').addEventListener('submit',async e=>{
 e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;
 const name=dialog.querySelector('#bbGiftName').value.trim(),email=dialog.querySelector('#bbGiftEmail').value.trim();if(!name||!email)return;
 const button=form.querySelector('button[type="submit"]'),status=dialog.querySelector('#bbGiftStatus');
 button.disabled=true;status.textContent='Submitting your request…';
 try{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  let response;
  try{response=await fetch(settings.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brand:'Basketball Brilliance',signup_type:'free_gift',name,email,source:location.href,timestamp:new Date().toISOString(),consent:'Requested one free basketball resource; no magazine or promotional subscription.'}),signal:controller.signal})}finally{clearTimeout(timeout)}
  if(!response.ok)throw new Error('Delivery service did not accept the request.');
  const result=await response.json();
  if(result?.accepted!==true)throw new Error('Delivery service did not confirm acceptance.');
  const parsed=new URL(settings.downloadUrl,location.href);
  if(!['https:','http:'].includes(parsed.protocol))throw new Error('Download address is invalid.');
  try{localStorage.setItem(key,'1')}catch{}
  form.hidden=true;dialog.querySelector('#bbGiftReady').hidden=false;dialog.querySelector('#bbGiftLink').href=parsed.href;
 }catch(err){status.textContent='We could not confirm your request. Please try again later. Your details are still here.';console.warn('BB gift delivery:',err.message)}
 finally{button.disabled=false}
});
})();
