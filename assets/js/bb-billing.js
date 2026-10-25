/* Basketball Brilliance — free-account compatibility layer.
 * The previous Stripe sandbox implementation remains in Git history and in
 * the pre-free-transition archive branch; no payments are initiated here.
 * Role selection uses account profiles and active team relationships.
 * Team and player records remain protected by Supabase RLS.
 */
(function(){
 'use strict';
 const validRoles=new Set(['coach','player','parent']);
 async function signedIn(){
   return typeof window.BBAuth?.getSession==='function'
     ? await window.BBAuth.getSession() : null;
 }
 async function checkAccess(role,{quiet=false}={}){
   role=String(role||'').toLowerCase();
   if(!validRoles.has(role))return false;
   try{
     const session=await signedIn();
     if(!session){
       if(!quiet)window.toast?.('Sign in with a free account to use saved '+role+' tools.');
       return false;
     }
     const profile=await window.BBAuth.getProfile();
     const verified=await window.BBAuth.resolveRole(role,profile);
     const allowed=String(verified||'').toLowerCase()===role;
     if(!quiet)window.toast?.(allowed?'Your free '+role+' account is ready.':'This account is not linked to the requested role. Ask your team administrator for an invitation.');
     return allowed;
   }catch(err){
     if(!quiet)window.toast?.('Account access cannot be checked right now. Please try again.');
     return false;
   }
 }
 async function start(role){
   role=String(role||'').toLowerCase();
   if(!validRoles.has(role))return false;
   const session=await signedIn();
   if(!session){
     if(typeof window.openLogin==='function')window.openLogin();
     if(typeof window.setAuthStatus==='function')window.setAuthStatus('Create or sign in to your free account. No payment is needed.','good');
     return false;
   }
   return await checkAccess(role);
 }
 // Preserve the historical API shape to avoid breaking other existing scripts.
 // No Stripe links, customer details, or payment redirects are reachable.
 window.BBBilling=Object.freeze({
   plans:Object.freeze({}),start,checkAccess,
   ready(){},async readiness(){return false;},mode:'free'
 });
})();