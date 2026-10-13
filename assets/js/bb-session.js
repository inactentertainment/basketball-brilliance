/* Restore confirmed sessions outside auth callbacks to avoid auth-lock deadlocks. */
(()=>{
 let recovery=false,restoring=false;
 const query=new URLSearchParams(location.search),hash=new URLSearchParams(location.hash.slice(1));
 recovery=query.get('auth')==='recovery'||hash.get('type')==='recovery';
 const authError=hash.get('error_description')||query.get('error_description');
 function showRecovery(){
  recovery=true;openLogin();
  document.getElementById('accountAge').value='adult';updateAccountAgeGate();
  let box=document.getElementById('bbPasswordRecovery');
  if(!box){box=document.createElement('div');box.id='bbPasswordRecovery';box.innerHTML='<label>New password<input id="bbNewPassword" type="password" autocomplete="new-password" minlength="8"></label><button type="button" class="btn primary" id="bbSavePassword">Save New Password</button>';document.getElementById('authBackendStatus').after(box);}
  box.hidden=false;setAuthStatus('Choose a new password of at least 8 characters.','good');
  document.getElementById('bbSavePassword').onclick=async()=>{
   const password=document.getElementById('bbNewPassword').value;
   if(password.length<8){setAuthStatus('Use at least 8 characters.','bad');return;}
   const {error}=await BBAuth.getClient().auth.updateUser({password});
   if(error){setAuthStatus(error.message,'bad');return;}
   recovery=false;box.hidden=true;history.replaceState({},'',location.pathname);setAuthStatus('Password updated. You can now sign in with it.','good');
  };
 }
 async function restore(){
  if(restoring)return;restoring=true;
  try{
   if(authError){openLogin();setAuthStatus(authError+'. Request a fresh confirmation or reset link.','bad');return;}
   const session=await BBAuth.getSession();if(!session)return;
   if(recovery){showRecovery();return;}
   const profile=await BBAuth.getProfile();
   const role=await BBAuth.resolveRole(profile.primary_role,profile);
   db.session={role,email:session.user.email};saveDB();
   if(query.get('auth')==='confirmed'){
    await enterPortal(role.toLowerCase());history.replaceState({},'',location.pathname+(query.get('invite')?'?invite='+encodeURIComponent(query.get('invite')):''));toast('Email confirmed. You are signed in.');
   }
  }catch(e){if(query.has('auth')){openLogin();setAuthStatus(e.message||'Account could not load. Try signing in again.','bad');}}
  finally{restoring=false;}
 }
 window.signOutAccount=async()=>{
  await BBAuth.signOut();window.BBJukebox?.close();
  db=structuredClone(defaultData);saveDB();
  coachBackendLoaded=false;currentTeamId=null;
  parentData={children:[],passport:[],opportunities:[],recruiting:[],steps:[],vault:[],connections:[]};
  playerData={goals:[],workouts:[],highlights:[],passport:[],opportunities:[],college:[],bounce:[],officialStats:[],linked:null};
  renderParentWorkspace();renderPlayerWorkspace();
  goEntry();openLogin();setAuthStatus('Signed out. Choose a role and sign in to the next account.','good');
 };
 BBAuth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')setTimeout(showRecovery,0);});
 restore();
 document.getElementById('loginPassword').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();continueLogin();}});
})();
