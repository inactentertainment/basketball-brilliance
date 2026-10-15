(function(){
 'use strict';
 const plans=Object.freeze({
  coach:Object.freeze({amount:47,currency:'usd',interval:'year',priceId:'price_1UNnG5IuokIcVOLNfhxbFNJx',url:'https://buy.stripe.com/test_5kQbJ26oLbil2th9rze3e00'}),
  parent:Object.freeze({amount:24,currency:'usd',interval:'year',priceId:'price_1UNwFtIuokIcVOLNm7TMfPJg',url:'https://buy.stripe.com/test_4gMbJ2bJ59adebZ1Z7e3e01'}),
  player:Object.freeze({amount:17,currency:'usd',interval:'year',priceId:'price_1UNwOQIuokIcVOLN6qFqhQ8B',url:'https://buy.stripe.com/test_28EbJ214r5Y15FtbzHe3e02'})
 });
 let busy=false,checking=false,returnTimer=null,roleShown=null,statusVersion=0;
 const storage={get:key=>{try{return sessionStorage.getItem(key)}catch{return null}},set:(key,value)=>{try{sessionStorage.setItem(key,value)}catch{}},remove:key=>{try{sessionStorage.removeItem(key)}catch{}}};
 const active=m=>window.BBAuth.membershipActive(m);
 function show(role,message){
  statusVersion++;roleShown=role;let box=document.getElementById('bbCheckoutStatus');
  if(!box){
   box=document.createElement('dialog');box.id='bbCheckoutStatus';box.setAttribute('aria-labelledby','bbCheckoutTitle');
   box.innerHTML='<h2 id="bbCheckoutTitle">Membership access</h2><p id="bbCheckoutMessage" role="status" aria-live="polite"></p><button type="button" class="btn primary" id="bbCheckAccess">Check membership access</button><button type="button" class="btn ghost" id="bbCloseCheckout">Close</button>';
   document.body.append(box);box.querySelector('#bbCloseCheckout').onclick=()=>box.close();box.addEventListener('close',()=>{statusVersion++;clearTimeout(returnTimer);returnTimer=null});
   box.querySelector('#bbCheckAccess').onclick=()=>checkAccess(roleShown);
  }
  box.querySelector('#bbCheckoutTitle').textContent=role[0].toUpperCase()+role.slice(1)+' membership';
  box.querySelector('#bbCheckoutMessage').textContent=message;
  if(!box.open)box.showModal();return box;
 }
 async function refresh(role){
  const fn={coach:window.refreshCoachMembershipState,parent:window.refreshParentMembershipState,player:window.refreshPlayerMembershipState}[role];
  if(fn)await fn();window.dispatchEvent(new CustomEvent('bb:membership-changed',{detail:{role}}));
 }
 async function checkAccess(role,{quiet=false}={}){
  if(!plans[role]||checking)return false;checking=true;
  if(!quiet)show(role,'Checking your membership…');const version=statusVersion;
  try{
   const session=await window.BBAuth.getSession();
   if(!session){if(!quiet&&version===statusVersion)show(role,'Sign in to check your membership. A return link or payment message alone does not activate access.');return false;}
   const membership=await window.BBData.getMyMembership(role),yes=active(membership);
   if(yes){storage.remove('bb-checkout-attempt');storage.remove('bb-pending-checkout');if(!quiet&&version===statusVersion)show(role,'Your '+role+' membership is active. You can use your member tools.');await refresh(role);}
   else if(!quiet&&version===statusVersion)show(role,'Membership access is not active yet. If you just completed checkout, wait a moment and choose Check membership access. Please do not pay again.');
   return yes;
  }catch{if(!quiet&&version===statusVersion)show(role,'Membership access could not be checked. Check your connection and try again. Please do not pay again.');return false;}
  finally{checking=false;}
 }
 async function readiness(){
  const response=await fetch(window.BB_SUPABASE_CONFIG.url+'/functions/v1/stripe-webhook',{cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('Checkout readiness unavailable');const state=await response.json();return state.configured===true&&state.mode==='sandbox';
 }
 async function start(role){
  if(!plans[role]||busy)return;busy=true;pendingMembershipRole=role;
  try{
   const session=await window.BBAuth.getSession();
   if(!session){db.session.role=role[0].toUpperCase()+role.slice(1);storage.set('bb-pending-checkout',role);closeModal('portalOfferModal');openLogin();setAuthStatus('Sign in with your adult account first, then continue to sandbox checkout. No real charges are made.','good');return;}
   if(active(await window.BBData.getMyMembership(role))){closeModal('portalOfferModal');show(role,'Your '+role+' membership is already active. You do not need to purchase it again.');await refresh(role);return;}
   if(document.getElementById('accountAge').value!=='adult'){closeModal('portalOfferModal');openLogin();setAuthStatus('Confirm you are 18 or older and sign in before opening checkout.','info');return;}
   if(!await readiness()){closeModal('portalOfferModal');show(role,'Sandbox checkout is temporarily unavailable because automatic membership activation is not connected. Existing members can still sign in. No payment has been started.');return;}
   const url=new URL(plans[role].url);url.searchParams.set('client_reference_id',session.user.id);
   storage.set('bb-checkout-attempt',JSON.stringify({role,userId:session.user.id,started:Date.now()}));storage.remove('bb-pending-checkout');location.assign(url.href);
  }catch{closeModal('portalOfferModal');show(role,'Checkout could not be opened safely. Check your connection and try again. No payment has been started.');}
  finally{busy=false;}
 }
 function ready(){const role=storage.get('bb-pending-checkout');if(plans[role]){pendingMembershipRole=role;openPortalOffer(role);toast('Signed in. Continue to check your membership or open sandbox checkout.');}}
 async function resume(){
  if(returnTimer||checking||busy)return;let attempt;try{attempt=JSON.parse(storage.get('bb-checkout-attempt')||'null')}catch{return;}
  if(!attempt||!plans[attempt.role])return;
  if(Date.now()-attempt.started>2*60*60*1000){storage.remove('bb-checkout-attempt');return;}
  const session=await window.BBAuth.getSession();if(!session||session.user.id!==attempt.userId){storage.remove('bb-checkout-attempt');return;}
  let count=0;const poll=async()=>{returnTimer=null;if(document.visibilityState==='hidden')return;const yes=await checkAccess(attempt.role);if(!yes&&++count<6&&document.getElementById('bbCheckoutStatus')?.open)returnTimer=setTimeout(poll,3000);};await poll();
 }
 window.BBBilling={plans,start,ready,checkAccess,readiness,mode:'sandbox'};
 window.addEventListener('pageshow',()=>{resume().catch(()=>{})});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')resume().catch(()=>{})});
})();
