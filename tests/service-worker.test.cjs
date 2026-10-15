const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('installed app never caches another account or payment/API responses',()=>{const handlers={};vm.runInContext(fs.readFileSync('sw.js','utf8'),vm.createContext({URL,self:{location:{origin:'https://basketballbrilliance.net'},addEventListener:(name,fn)=>handlers[name]=fn}}));
 for(const request of [new Request('https://project.supabase.co/rest/v1/memberships'),new Request('https://project.supabase.co/auth/v1/user'),new Request('https://buy.stripe.com/test_fixture'),new Request('https://basketballbrilliance.net/assets/user.json',{headers:{Authorization:'Bearer fixture'}}),new Request('https://basketballbrilliance.net/api/me')]){
  let intercepted=false;handlers.fetch({request,respondWith:()=>intercepted=true});assert.equal(intercepted,false,request.url);
 }
});
