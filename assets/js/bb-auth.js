(function(){
  let client=null;
  function cfg(){return window.BB_SUPABASE_CONFIG||{}}
  function isConfigured(){const c=cfg();return !!(c.configured&&c.url&&c.publishableKey&&window.supabase)}
  function getClient(){
    if(!isConfigured()) return null;
    if(!client) client=window.supabase.createClient(cfg().url,cfg().publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return client;
  }
  async function signUp({email,password,role,fullName}){
    const s=getClient(); if(!s) throw new Error("Basketball Brilliance backend is not connected yet.");
    return s.auth.signUp({email:email.trim().toLowerCase(),password,options:{data:{role:String(role||"player").toLowerCase(),full_name:fullName||""},emailRedirectTo:redirectURL()}});
  }
  async function signIn({email,password}){
    const s=getClient(); if(!s) throw new Error("Basketball Brilliance backend is not connected yet.");
    return s.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
  }
  async function signOut(){const s=getClient(); if(s) return s.auth.signOut()}
  async function resetPassword(email){
    const s=getClient(); if(!s) throw new Error("Basketball Brilliance backend is not connected yet.");
    return s.auth.resetPasswordForEmail(email,{redirectTo:redirectURL('recovery')});
  }
  async function resendConfirmation(email){
    const s=getClient(); if(!s) throw new Error("Basketball Brilliance backend is not connected yet.");
    return s.auth.resend({type:"signup",email,options:{emailRedirectTo:redirectURL()}});
  }
  async function getSession(){const s=getClient();if(!s)return null;const {data}=await s.auth.getSession();return data.session}
  async function getProfile(){
    const s=getClient();if(!s)return null;
    const session=await getSession();if(!session)return null;
    const {data,error}=await s.from("profiles").select("*").eq("id",session.user.id).single();
    if(error) throw error; return data;
  }
  function onAuthStateChange(cb){const s=getClient();if(!s)return null;return s.auth.onAuthStateChange(cb)}
  function redirectURL(kind='confirmed'){
    const url=new URL(location.pathname,location.origin);
    const invite=new URLSearchParams(location.search).get('invite');
    if(invite)url.searchParams.set('invite',invite);
    url.searchParams.set('auth',kind);return url.href;
  }
  async function resolveRole(requested,profile){
    const desired=String(requested||'').toLowerCase();
    const session=await getSession();if(!session)throw new Error('Please sign in again.');
    const {data,error}=await getClient().from('memberships').select('role,status,current_period_end').eq('user_id',session.user.id);
    if(error)throw error;
    const permitted=(data||[]).some(m=>m.role===desired&&m.status==='active'&&(!m.current_period_end||new Date(m.current_period_end)>new Date()));
    const role=permitted?desired:profile?.primary_role;
    if(!['coach','player','parent'].includes(role))throw new Error('Your account role could not be loaded. Please contact support.');
    return role.charAt(0).toUpperCase()+role.slice(1);
  }
  window.BBAuth={isConfigured,getClient,signUp,signIn,signOut,resetPassword,resendConfirmation,getSession,getProfile,onAuthStateChange,resolveRole};
})();
