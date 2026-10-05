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
    if(!teamId) throw new Error("Team is required.");
    const {data,error}=await s().rpc("create_team_player",{
      p_team_id:teamId,
      p_first_name:payload.first_name||"",
      p_last_name:payload.last_name||null,
      p_jersey_number:payload.jersey_number||null,
      p_position:payload.position||null,
      p_grade:payload.grade||null,
      p_height_text:payload.height_text||null,
      p_guardian_name:payload.guardian_name||null,
      p_guardian_email:payload.guardian_email||null,
      p_guardian_phone:payload.guardian_phone||null
    });
    if(error) throw error;
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
  async function importTeamPlayers(teamId,players){
    if(!teamId) throw new Error("Save Team Setup before importing a roster.");
    if(!Array.isArray(players)||!players.length) throw new Error("No players to import.");
    const {data,error}=await s().rpc("import_team_players",{p_team_id:teamId,p_players:players});
    if(error) throw error;
    return data;
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

  async function listPractices(teamId){
    const {data,error}=await s().from("practices").select("*").eq("team_id",teamId).order("practice_date",{ascending:false}).order("created_at",{ascending:false});
    if(error) throw error; return data||[];
  }
  async function savePractice(teamId,payload){
    const u=await me();
    const row={
      team_id:teamId,created_by:u.id,title:payload.title||"Practice",
      practice_date:payload.practice_date||null,objectives:payload.objectives||null,
      plan:payload.plan||{},notes:payload.notes||null
    };
    if(payload.id){
      const {data,error}=await s().from("practices").update(row).eq("id",payload.id).select().single();
      if(error) throw error; return data;
    }
    const {data,error}=await s().from("practices").insert(row).select().single();
    if(error) throw error; return data;
  }
  async function deletePractice(id){
    const {error}=await s().from("practices").delete().eq("id",id); if(error) throw error; return true;
  }

  async function listGames(teamId){
    const {data,error}=await s().from("games").select("*").eq("team_id",teamId).order("game_date",{ascending:false}).order("created_at",{ascending:false});
    if(error) throw error; return data||[];
  }
  async function saveGame(teamId,payload){
    const u=await me();
    const result=(Number(payload.team_score)>Number(payload.opponent_score))?"W":(Number(payload.team_score)<Number(payload.opponent_score))?"L":"T";
    const row={
      team_id:teamId,created_by:u.id,game_date:payload.game_date||null,
      opponent:payload.opponent,location:payload.location||null,
      team_score:Number(payload.team_score||0),opponent_score:Number(payload.opponent_score||0),
      result,notes:payload.notes||null
    };
    if(payload.id){
      const {data,error}=await s().from("games").update(row).eq("id",payload.id).select().single();
      if(error) throw error; return data;
    }
    const {data,error}=await s().from("games").insert(row).select().single();
    if(error) throw error; return data;
  }
  async function deleteGame(id){
    const {error}=await s().from("games").delete().eq("id",id); if(error) throw error; return true;
  }

  async function listTeamStats(teamId){
    const {data,error}=await s()
      .from("player_game_stats")
      .select("*,games!inner(id,team_id,opponent,game_date),players(id,first_name,last_name)")
      .eq("games.team_id",teamId);
    if(error) throw error; return data||[];
  }
  async function saveStat(payload){
    const row={
      game_id:payload.game_id,player_id:payload.player_id,
      minutes:Number(payload.minutes||0),points:Number(payload.points||0),
      rebounds:Number(payload.rebounds||0),assists:Number(payload.assists||0),
      steals:Number(payload.steals||0),blocks:Number(payload.blocks||0),
      turnovers:Number(payload.turnovers||0),extras:payload.extras||{}
    };
    const {data,error}=await s().from("player_game_stats")
      .upsert(row,{onConflict:"game_id,player_id"}).select().single();
    if(error) throw error; return data;
  }
  async function deleteStat(id){
    const {error}=await s().from("player_game_stats").delete().eq("id",id); if(error) throw error; return true;
  }

  async function listScoutingReports(teamId){
    const {data,error}=await s().from("scouting_reports").select("*").eq("team_id",teamId).order("created_at",{ascending:false});
    if(error) throw error; return data||[];
  }
  async function saveScoutingReport(teamId,payload){
    const u=await me();
    const row={team_id:teamId,created_by:u.id,opponent:payload.opponent,report:payload.report||{},notes:payload.notes||null};
    if(payload.id){
      const {data,error}=await s().from("scouting_reports").update(row).eq("id",payload.id).select().single();
      if(error) throw error; return data;
    }
    const {data,error}=await s().from("scouting_reports").insert(row).select().single();
    if(error) throw error; return data;
  }
  async function deleteScoutingReport(id){
    const {error}=await s().from("scouting_reports").delete().eq("id",id); if(error) throw error; return true;
  }

  async function listSeasonNotes(teamId){
    const {data,error}=await s().from("season_notes").select("*").eq("team_id",teamId).order("note_date",{ascending:false}).order("created_at",{ascending:false});
    if(error) throw error; return data||[];
  }
  async function saveSeasonNote(teamId,payload){
    const u=await me();
    const row={team_id:teamId,created_by:u.id,note_date:payload.note_date||new Date().toISOString().slice(0,10),category:payload.category||null,title:payload.title||null,body:payload.body||""};
    if(payload.id){
      const {data,error}=await s().from("season_notes").update(row).eq("id",payload.id).select().single();
      if(error) throw error; return data;
    }
    const {data,error}=await s().from("season_notes").insert(row).select().single();
    if(error) throw error; return data;
  }
  async function deleteSeasonNote(id){
    const {error}=await s().from("season_notes").delete().eq("id",id); if(error) throw error; return true;
  }


  async function saveCoachIQHistory(teamId,payload){
    const u=await me();
    const row={team_id:teamId,user_id:u.id,query:payload.query,scenario_key:payload.scenario_key||null,selected_solution:payload.selected_solution||null};
    const {data,error}=await s().from("coach_iq_history").insert(row).select().single();
    if(error) throw error; return data;
  }
  async function listCoachIQHistory(teamId){
    const {data,error}=await s().from("coach_iq_history").select("*").eq("team_id",teamId).order("created_at",{ascending:false}).limit(20);
    if(error) throw error; return data||[];
  }

  async function listCoachPlays(teamId){
    const {data,error}=await s().from("coach_plays").select("*").eq("team_id",teamId).order("created_at",{ascending:false});
    if(error) throw error; return data||[];
  }
  async function saveCoachPlay(teamId,payload){
    const u=await me();
    const row={team_id:teamId,created_by:u.id,name:payload.name,description:payload.description||null,markers:payload.markers||[],source:payload.source||null,updated_at:new Date().toISOString()};
    if(payload.id){
      const {data,error}=await s().from("coach_plays").update(row).eq("id",payload.id).select().single();
      if(error) throw error; return data;
    }
    const {data,error}=await s().from("coach_plays").insert(row).select().single();
    if(error) throw error; return data;
  }
  async function deleteCoachPlay(id){
    const {error}=await s().from("coach_plays").delete().eq("id",id);
    if(error) throw error; return true;
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
    createPlayer,updatePlayer,listTeamPlayers,removePlayerFromTeam,importTeamPlayers,
    createInvite,listInvites,revokeInvite,listStaff,acceptInvite,myMemberships,
    listPractices,savePractice,deletePractice,
    listGames,saveGame,deleteGame,listTeamStats,saveStat,deleteStat,
    listScoutingReports,saveScoutingReport,deleteScoutingReport,
    listSeasonNotes,saveSeasonNote,deleteSeasonNote,
    saveCoachIQHistory,listCoachIQHistory,
    listCoachPlays,saveCoachPlay,deleteCoachPlay,dashboard
  };
})();