(function(){
  function s(){const c=window.BBAuth?.getClient?.();if(!c)throw new Error("Backend is not connected yet.");return c}
  async function me(){const sess=await window.BBAuth.getSession();if(!sess)throw new Error("Sign in required.");return sess.user}
  async function createOrganization(name){
    const u=await me(); const {data,error}=await s().from("organizations").insert({name,created_by:u.id}).select().single();if(error)throw error;return data;
  }
  async function createTeam(payload){
    const u=await me(); const row={...payload,created_by:u.id,head_coach_id:u.id};
    const {data,error}=await s().from("teams").insert(row).select().single();if(error)throw error;
    await s().from("team_memberships").insert({team_id:data.id,user_id:u.id,role:"coach",status:"active"});return data;
  }
  async function listMyTeams(){
    const u=await me();
    const {data,error}=await s().from("team_memberships").select("team_id,role,status,teams(*)").eq("user_id",u.id).eq("status","active");
    if(error)throw error;return data||[];
  }
  async function createPlayer(payload,teamId){
    const u=await me(); const {data,error}=await s().from("players").insert({...payload,created_by:u.id}).select().single();if(error)throw error;
    if(teamId){const j=await s().from("team_players").insert({team_id:teamId,player_id:data.id});if(j.error)throw j.error} return data;
  }
  async function createInvite({teamId,playerId,email,role}){
    const u=await me();const {data,error}=await s().from("team_invites").insert({team_id:teamId,player_id:playerId||null,email,role,created_by:u.id}).select().single();if(error)throw error;return data;
  }
  async function acceptInvite(code){const {data,error}=await s().rpc("accept_team_invite",{p_code:code});if(error)throw error;return data}
  async function myMemberships(){const u=await me();const {data,error}=await s().from("memberships").select("*").eq("user_id",u.id);if(error)throw error;return data||[]}
  window.BBData={createOrganization,createTeam,listMyTeams,createPlayer,createInvite,acceptInvite,myMemberships};
})();