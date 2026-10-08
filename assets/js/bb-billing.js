(function(){
 const plans=Object.freeze({
  coach:{amount:47,url:'https://buy.stripe.com/test_5kQbJ26oLbil2th9rze3e00'},
  parent:{amount:24,url:'https://buy.stripe.com/test_4gMbJ2bJ59adebZ1Z7e3e01'},
  player:{amount:17,url:'https://buy.stripe.com/test_28EbJ214r5Y15FtbzHe3e02'}
 });
 async function start(role){
  if(!plans[role])return;
  pendingMembershipRole=role;
  const session=await window.BBAuth?.getSession?.();
  if(!session){
   db.session.role=role[0].toUpperCase()+role.slice(1);
   sessionStorage.setItem('bb-pending-checkout',role);
   closeModal('portalOfferModal');openLogin();
   setAuthStatus('Sign in with your adult account first. Then choose Continue to Stripe Sandbox. No real charges are made in sandbox.','good');
   return;
  }
  if(document.getElementById('accountAge').value!=='adult'){
   closeModal('portalOfferModal');openLogin();setAuthStatus('Confirm you are 18 or older and sign in before opening sandbox checkout.','info');return;
  }
  const url=new URL(plans[role].url);url.searchParams.set('client_reference_id',session.user.id);
  sessionStorage.removeItem('bb-pending-checkout');
  location.assign(url.href);
 }
 function ready(){
  const role=sessionStorage.getItem('bb-pending-checkout');
  if(plans[role]){pendingMembershipRole=role;openPortalOffer(role);toast('Signed in. Choose Continue to Stripe Sandbox to test your membership.');}
 }
 window.BBBilling={plans,start,ready,mode:'sandbox'};
})();
