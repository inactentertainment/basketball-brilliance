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
    return s.auth.signUp({email,password,options:{data:{role:String(role||"player").toLowerCase(),full_name:fullName||""},emailRedirectTo:location.origin+location.pathname+location.search}});
  }
  async function signIn({email,password}){
    const s=getClient(); if(!s) throw new Error("Basketball Brilliance backend is not connected yet.");
    return s.auth.signInWithPassword({email,password});
  }
  async function signOut(){const s=getClient(); if(s) return s.auth.signOut()}
  async function resetPassword(email){
    const s=getClient(); if(!s) throw new Error("Basketball Brilliance backend is not connected yet.");
    return s.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname+location.search});
  }
  async function resendConfirmation(email){
    const s=getClient(); if(!s) throw new Error("Basketball Brilliance backend is not connected yet.");
    return s.auth.resend({type:"signup",email,options:{emailRedirectTo:location.origin+location.pathname+location.search}});
  }
  async function getSession(){const s=getClient();if(!s)return null;const {data}=await s.auth.getSession();return data.session}
  async function getProfile(){
    const s=getClient();if(!s)return null;
    const session=await getSession();if(!session)return null;
    const {data,error}=await s.from("profiles").select("*").eq("id",session.user.id).single();
    if(error) throw error; return data;
  }
  function onAuthStateChange(cb){const s=getClient();if(!s)return null;return s.auth.onAuthStateChange(cb)}
  window.BBAuth={isConfigured,getClient,signUp,signIn,signOut,resetPassword,resendConfirmation,getSession,getProfile,onAuthStateChange};
})();