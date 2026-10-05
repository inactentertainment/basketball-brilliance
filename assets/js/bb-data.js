(function(){
  function s(){
    const c=window.BBAuth?.getClient?.();
    if(!c) throw new Error("Backend is not connected yet.");
    return c;
  }
  async function me(){
    const sess=await window.BBAuth.getSession();
    if(!sess) throw new Error("Sign in required.");
    return sess.user;
  }
  async function getProfile(){
    const u=await me();
    const {data,error}=await s().from("profiles").select("*").eq("id",u.id).single();
    if(error) throw error;
    return data;
  }
  async function updateProfile(patch){
    const u=await me();
    const {data,error}=await s().from("profiles").update(patch).eq("id",u.id).select().single();
    if(error) throw error;
    return data;
  }
  async function createOrganization(name){
    const u=await me();
    const clean=(name||"").trim();
    if(!clean) return null;
    const found=await s().from("organizations").select("*").eq("created_by",u.id).ilike("name",clean).limit(1);
    if(found.error) throw found.error;
    if(found.data?.[0]) return found.data[0];
    const {data,error}=await s().from("organizations").insert({name:clean,created_by:u.id}).select().single();
    if(error) throw error;
    return data;
  }
  async function saveTeam(payload){
    const u=await me();
    let organization_id=payload.organization_id||null;
    if(payload.organization_name){
      const org=await createOrganization(payload.organization_name);
      organization_id=org?.id||null;
    }
    const row={
      name:payload.name,
      season:payload.season||null,
      level:payload.level||null,
      home_gym:payload.home_gym||null,
      organization_id
    };
    if(payload.id){
      const {data,error}=await s().from("teams").update(row).eq("id",payload.id).select().single();
      if(error) throw error;
      return data;
    }
    const {data,error}=await s().from("teams").insert({...row,head_coach_id:u.id,created_by:u.id}).select().single();
    if(error) throw error;
    const m=await s().from("team_memberships").insert({
      team_id:data.id,user_id:u.id,role:"coach",status:"active",staff_title:"Head Coach"
    });
    if(m.error && !/duplicate/i.test(String(m.error.message))) throw m.error;
    return data;
  }
  async function listMyTeams(){
    const u=await me();
    const {data,error}=await s()
      .from("team_memberships")
      .select("team_id,role,status,staff_title,teams(*)")
      .eq("user_id",u.id)
      .eq("status","active");
    if(error) throw error;
    return data||[];
  }
  async function getTeam(teamId){
    const {data,error}=await s().from("teams").select("*,organizations(name)").eq("id",teamId).single();
    if(error) throw error;
    return data;
  }
  async function createPlayer(payload,teamId){
    const u=await me();
    const {data,error}=await s().from("players").insert({...payload,created_by:u.id}).select().single();
    if(error) throw error;
    if(teamId){
      const j=await s().from("team_players").insert({team_id:teamId,player_id:data.id,status:"active"});
      if(j.error) throw j.error;
    }
    return data;
  }
  async function updatePlayer(playerId,payload){
    const {data,error}=await s().from("players").update(payload).eq("id",playerId).select().single();
    if(error) throw error;
    return data;
  }
  async function listTeamPlayers(teamId){
    const {data,error}=await s()
      .from("team_players")
      .select("id,status,player_id,players(*)")
      .eq("team_id",teamId)
      .eq("status","active")
      .order("created_at",{ascending:true});
    if(error) throw error;
    return data||[];
  }
  async function removePlayerFromTeam(teamId,playerId){
    const {error}=await s().from("team_players").delete().eq("team_id",teamId).eq("player_id",playerId);
    if(error) throw error;
    return true;
  }
  async function createInvite({teamId,playerId,email,role,inviteeName,staffTitle}){
    const u=await me();
    const row={
      team_id:teamId,
      player_id:playerId||null,
      email:(email||"").trim(),
      role,
      invitee_name:(inviteeName||"").trim()||null,
      staff_title:role==="coach"?(staffTitle||"Assistant Coach"):null,
      created_by:u.id
    };
    const {data,error}=await s().from("team_invites").insert(row).select().single();
    if(error) throw error;
    return data;
  }
  async function listInvites(teamId){
    const {data,error}=await s()
      .from("team_invites")
      .select("*")
      .eq("team_id",teamId)
      .order("created_at",{ascending:false});
    if(error) throw error;
    return data||[];
  }
  async function revokeInvite(id){
    const {data,error}=await s().from("team_invites").update({status:"revoked"}).eq("id",id).select().single();
    if(error) throw error;
    return data;
  }
  async function listStaff(teamId){
    const {data,error}=await s()
      .from("team_memberships")
      .select("id,user_id,role,status,staff_title,profiles(full_name,email)")
      .eq("team_id",teamId)
      .eq("role","coach")
      .eq("status","active")
      .order("created_at",{ascending:true});
    if(error) throw error;
    return data||[];
  }
  async function acceptInvite(code){
    const {data,error}=await s().rpc("accept_team_invite",{p_code:code});
    if(error) throw error;
    return data;
  }
  async function myMemberships(){
    const u=await me();
    const {data,error}=await s().from("memberships").select("*").eq("user_id",u.id);
    if(error) throw error;
    return data||[];
  }
  async function dashboard(teamId){
    const [players,invites,staff,practices,games]=await Promise.all([
      listTeamPlayers(teamId),
      listInvites(teamId),
      listStaff(teamId),
      s().from("practices").select("id",{count:"exact",head:true}).eq("team_id",teamId),
      s().from("games").select("id,team_score,opponent_score",{count:"exact"}).eq("team_id",teamId)
    ]);
    let wins=0,losses=0;
    (games.data||[]).forEach(g=>{
      if(Number(g.team_score)>Number(g.opponent_score)) wins++;
      else if(Number(g.team_score)<Number(g.opponent_score)) losses++;
    });
    return {
      playerCount:players.length,
      inviteCount:invites.filter(x=>x.status==="pending").length,
      assistantCount:Math.max(0,staff.filter(x=>(x.staff_title||"")!=="Head Coach").length),
      practiceCount:practices.count||0,
      gameCount:games.count||0,
      wins,losses,
      players,invites,staff
    };
  }
  window.BBData={
    getProfile,updateProfile,createOrganization,saveTeam,listMyTeams,getTeam,
    createPlayer,updatePlayer,listTeamPlayers,removePlayerFromTeam,
    createInvite,listInvites,revokeInvite,listStaff,acceptInvite,myMemberships,dashboard
  };
})();