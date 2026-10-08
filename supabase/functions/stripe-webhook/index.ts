// Sandbox-only membership fulfillment. No browser-supplied payment status is trusted.
const plans = {
 'https://buy.stripe.com/test_5kQbJ26oLbil2th9rze3e00': {role:'coach',amount:4700},
 'https://buy.stripe.com/test_4gMbJ2bJ59adebZ1Z7e3e01': {role:'parent',amount:2400},
 'https://buy.stripe.com/test_28EbJ214r5Y15FtbzHe3e02': {role:'player',amount:1700}
};
const env = name => Deno.env.get(name) || '';
async function authentic(body,header,secret){
 const parts=header.split(',').map(x=>x.split('='));const stamp=parts.find(x=>x[0]==='t')?.[1];
 if(!stamp||!/^\d+$/.test(stamp)||Math.abs(Date.now()/1000-Number(stamp))>300)return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 for(const [tag,hex] of parts){if(tag==='v1'&&/^[a-f0-9]{64}$/.test(hex)){
  const bytes=Uint8Array.from(hex.match(/../g),x=>parseInt(x,16));
  if(await crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(stamp+'.'+body)))return true;
 }}return false;
}
async function stripe(path){
 const res=await fetch('https://api.stripe.com/v1/'+path,{headers:{Authorization:'Bearer '+env('STRIPE_TEST_SECRET_KEY')}});
 if(!res.ok)throw new Error('Stripe lookup failed');return res.json();
}
async function database(path,method='GET',body){
 const res=await fetch(env('SUPABASE_URL')+'/rest/v1/'+path,{method,headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:'Bearer '+env('SUPABASE_SERVICE_ROLE_KEY'),'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=representation'},body:body?JSON.stringify(body):undefined});
 if(!res.ok)throw new Error('Membership update failed');return res.status===204?[]:res.json();
}
const identifier=x=>typeof x==='string'?x:x?.id;
function membership(subscription){
 const currentEnd=subscription.current_period_end||subscription.items?.data?.[0]?.current_period_end;
 return {status:['active','trialing'].includes(subscription.status)?'active':['past_due','unpaid','incomplete'].includes(subscription.status)?'past_due':subscription.status==='canceled'?'canceled':'expired',current_period_end:currentEnd?new Date(currentEnd*1000).toISOString():null,updated_at:new Date().toISOString()};
}
Deno.serve(async req=>{
 const configured=Boolean(/^(sk|rk)_test_/.test(env('STRIPE_TEST_SECRET_KEY'))&&env('STRIPE_WEBHOOK_SIGNING_SECRET')&&env('SUPABASE_SERVICE_ROLE_KEY'));
 if(req.method==='GET')return Response.json({mode:'sandbox',configured});
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 if(!configured)return new Response('Sandbox webhook setup is pending',{status:503});
 const body=await req.text();
 if(!await authentic(body,req.headers.get('stripe-signature')||'',env('STRIPE_WEBHOOK_SIGNING_SECRET')))return new Response('Invalid signature',{status:400});
 let event;try{event=JSON.parse(body);}catch{return new Response('Invalid payload',{status:400});}
 if(event.livemode!==false)return new Response('Test events only',{status:400});
 try{
  if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
   const session=await stripe('checkout/sessions/'+encodeURIComponent(event.data.object.id));
   if(session.livemode!==false||session.mode!=='subscription'||session.payment_status!=='paid')return Response.json({received:true,pending:true});
   const uid=session.client_reference_id;
   if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid||''))throw new Error('Account reference missing');
   const link=await stripe('payment_links/'+encodeURIComponent(identifier(session.payment_link)));
   const plan=plans[link.url];if(!plan||link.livemode!==false)throw new Error('Unrecognized plan');
   const subscription=await stripe('subscriptions/'+encodeURIComponent(identifier(session.subscription)));
   const items=subscription.items?.data||[];
   if(subscription.livemode!==false||items.length!==1||items[0].quantity!==1||items[0].price.unit_amount!==plan.amount||items[0].price.currency!=='usd'||items[0].price.recurring?.interval!=='year'||items[0].price.recurring?.interval_count!==1)throw new Error('Plan mismatch');
   const users=await database('profiles?id=eq.'+uid+'&select=id');if(users.length!==1)throw new Error('Account not found');
   const old=await database('memberships?user_id=eq.'+uid+'&role=eq.'+plan.role+'&select=provider,status');
   if(old.some(x=>x.provider==='stripe'&&x.status==='active'))throw new Error('Live membership cannot be replaced by sandbox');
   await database('memberships?on_conflict=user_id,role','POST',{user_id:uid,role:plan.role,plan_code:plan.role+'_annual_sandbox',provider:'stripe_test',provider_customer_id:identifier(session.customer),provider_subscription_id:subscription.id,...membership(subscription)});
  }else if(['customer.subscription.updated','customer.subscription.deleted','invoice.paid','invoice.payment_failed'].includes(event.type)){
   const object=event.data.object;
   const subId=event.type.startsWith('customer.subscription.')?object.id:identifier(object.subscription||object.parent?.subscription_details?.subscription);
   if(subId){const subscription=await stripe('subscriptions/'+encodeURIComponent(subId));if(subscription.livemode!==false)throw new Error('Test subscriptions only');await database('memberships?provider=eq.stripe_test&provider_subscription_id=eq.'+encodeURIComponent(subId),'PATCH',membership(subscription));}
  }
  return Response.json({received:true});
 }catch{return new Response('Membership reconciliation could not complete',{status:500});}
});
