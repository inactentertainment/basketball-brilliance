const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{parseHTML}=require('linkedom');
function freeEnvironment(){
 const{window:w}=parseHTML('<html><body><select id="accountAge"><option value="adult" selected>18 or older</option></select></body></html>');
 const visits=[],events=[],messages=[];
 const profile={primary_role:'coach'};
 Object.assign(w,{URL,AbortSignal,CustomEvent:w.CustomEvent,location:{assign:url=>visits.push(url),search:''},
   pendingMembershipRole:'coach',db:{session:{}},closeModal:()=>{},openLogin:()=>events.push('login'),
   setAuthStatus:message=>messages.push(message),toast:message=>messages.push(message)});
 w.BBAuth={getSession:async()=>({user:{id:'user-a'}}),getProfile:async()=>profile,
   resolveRole:async()=> 'Coach'};
 vm.runInContext(fs.readFileSync('assets/js/bb-billing.js','utf8'),vm.createContext(w));
 return {w,profile,visits,events,messages};
}
test('free coach role is usable without creating a subscription or Stripe redirect',async()=>{
 const {w,visits}=freeEnvironment();
 assert.equal(w.BBBilling.mode,'free');
 assert.equal(Object.keys(w.BBBilling.plans).length,0);
 assert.equal(await w.BBBilling.start('coach'),true);
 assert.equal(await w.BBBilling.readiness(),false);
 assert.equal(visits.length,0);
 assert(!fs.readFileSync('assets/js/bb-billing.js','utf8').includes('buy.stripe.com'));
});
test('guest account flow prompts for free registration without checkout',async()=>{
 const {w,visits,events,messages}=freeEnvironment();w.BBAuth.getSession=async()=>null;
 assert.equal(await w.BBBilling.start('parent'),false);
 assert(events.includes('login'));
 assert(messages.some(x=>/free account|no payment/i.test(x)));
 assert.equal(visits.length,0);
});
test('verified role mismatch cannot impersonate another portal role',async()=>{
 const {w,visits}=freeEnvironment();
 w.BBAuth.resolveRole=async()=> 'Coach';
 assert.equal(await w.BBBilling.checkAccess('player',{quiet:true}),false);
 assert.equal(await w.BBBilling.checkAccess('coach',{quiet:true}),true);
 assert.equal(await w.BBBilling.start('invalid-role'),false);
 assert.equal(visits.length,0);
});
test('free role resolver uses primary role or active team membership, not paid plan',async()=>{
 const calls=[];
 let rows=[{role:'coach',status:'active'}];
 const qb={select(){return this},eq(){return this},limit:async()=>({data:rows,error:null})};
 const client={auth:{getSession:async()=>({data:{session:{user:{id:'user-a'}}}})},
   from:name=>{calls.push(name);return qb;}};
 const w={BB_SUPABASE_CONFIG:{configured:true,url:'https://example.invalid',publishableKey:'public'},
   supabase:{createClient:()=>client},console,Date};w.window=w;
 vm.runInContext(fs.readFileSync('assets/js/bb-auth.js','utf8'),vm.createContext(w));
 assert.equal(await w.BBAuth.resolveRole('player',{primary_role:'player'}),'Player');
 assert.equal(await w.BBAuth.resolveRole('coach',{primary_role:'player'}),'Coach');
 rows=[];assert.equal(await w.BBAuth.resolveRole('coach',{primary_role:'player'}),'Player');
 assert.deepEqual(calls,['team_memberships','team_memberships']);
 assert.equal(w.BBAuth.membershipActive({status:'active',current_period_end:'invalid'}),false);
});
test('public tools and no-subscription UI retain coach/player data source',()=>{
 const html=fs.readFileSync('index.html','utf8'),data=fs.readFileSync('assets/js/bb-data.js','utf8');
 assert(html.includes('Free Coach Workspace'));
 assert(html.includes('#portalOfferModal { display:none !important; }'));
 assert(html.includes('Player Next Move is free.'));
 assert(data.includes('saveTeam('));assert(data.includes('saveCoachPlay('));
 assert(data.includes('team_memberships'));assert(data.includes('savePlayer'));
 const sql=fs.readFileSync('supabase/migrations/001_foundation.sql','utf8');
 assert(sql.includes('row level security'));
});
test('auth subscribers make API calls after the Supabase lock releases; local sign-out',async()=>{
 let handler,locked=false,calls=0,scope;const client={auth:{onAuthStateChange:fn=>{handler=fn;return{data:{subscription:{unsubscribe(){}}}}},getSession:async()=>{assert.equal(locked,false);calls++;return{data:{session:null}}},signOut:async opts=>{scope=opts.scope;return{error:null}}}};
 const w={BB_SUPABASE_CONFIG:{configured:true,url:'x',publishableKey:'x'},supabase:{createClient:()=>client},setTimeout,console,Date};w.window=w;const ctx=vm.createContext(w);vm.runInContext(fs.readFileSync('assets/js/bb-auth.js','utf8'),ctx);w.BBAuth.onAuthStateChange(()=>w.BBAuth.getSession());locked=true;handler('SIGNED_IN',null);assert.equal(calls,0);locked=false;await new Promise(r=>setTimeout(r,10));assert.equal(calls,1);await w.BBAuth.signOut();assert.equal(scope,'local');assert.equal(w.BBAuth.membershipActive({status:'active',current_period_end:'invalid'}),false);
});
test('auth unsubscribe cancels queued callbacks',async()=>{let handler,calls=0;const w={BB_SUPABASE_CONFIG:{configured:true,url:'x',publishableKey:'x'},supabase:{createClient:()=>({auth:{onAuthStateChange:fn=>{handler=fn;return{data:{subscription:{unsubscribe(){}}}}}}})},setTimeout,console};w.window=w;vm.runInContext(fs.readFileSync('assets/js/bb-auth.js','utf8'),vm.createContext(w));const subscription=w.BBAuth.onAuthStateChange(()=>calls++);handler('SIGNED_IN',null);subscription.data.subscription.unsubscribe();await new Promise(r=>setTimeout(r,10));assert.equal(calls,0);});
test('mobile account fields, keyboard-safe dialogs and update cache rules are present',()=>{const css=fs.readFileSync('assets/account-flow.css','utf8');assert(css.includes('100dvh'));assert(css.includes('font-size:16px'));assert(css.includes('min-height:44px'));const html=fs.readFileSync('index.html','utf8');assert.equal((html.match(/accountEpoch!==/g)||[]).length,4);assert(html.includes('bb-billing.js?v=61'));assert(fs.readFileSync('sw.js','utf8').includes('basketball-brilliance-v61'));});
test('switch-account cleanup removes previous account records and checkout state',async()=>{const{window:w}=parseHTML('<html><body><input id="loginPassword"></body></html>');const local=new Map([['bb_active_team','old-team']]),memory=new Map([['bb-checkout-attempt','old-attempt'],['bb-pending-checkout','coach']]);let entry=0;Object.assign(w,{URLSearchParams,structuredClone,location:{search:'',hash:'',pathname:'/'},localStorage:{removeItem:k=>local.delete(k)},sessionStorage:{removeItem:k=>memory.delete(k)},defaultData:{session:{email:'',role:'Coach'},players:[]},db:{session:{email:'old@example.invalid'},players:[{name:'Old private record'}]},parentData:{children:[{name:'Old child'}]},playerData:{goals:['Old private goal']},coachBackendLoaded:true,currentTeamId:'old-team',persistentCoachDashboard:{old:true},saveDB(){},renderParentWorkspace(){},renderPlayerWorkspace(){},goEntry:()=>entry++,openLogin(){},setAuthStatus(){},BBAuth:{getSession:async()=>null,signOut:async()=>{},onAuthStateChange:()=>{}}});vm.runInContext(fs.readFileSync('assets/js/bb-session.js','utf8'),vm.createContext(w));await w.signOutAccount();assert.equal(entry,1);assert.equal(w.db.players.length,0);assert.equal(w.parentData.children.length,0);assert.equal(w.playerData.goals.length,0);assert.equal(w.currentTeamId,null);assert.equal(w.persistentCoachDashboard,null);assert.equal(local.size,0);assert.equal(memory.size,0);});
