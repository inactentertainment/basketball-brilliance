/* Basketball Brilliance Play Lab — authenticated API adapter.
 * Development branch only. Pass the existing authenticated Supabase client.
 * The server's RLS policies, not this file, enforce authorization.
 * Progress is self-reported formative learning, NOT verified mastery.
 */
export function createPlayLabApi(supabase) {
  if (!supabase?.auth || !supabase?.from) throw Error('Authenticated Supabase client required');
  async function user() {
    const {data,error}=await supabase.auth.getUser();
    if(error||!data?.user)throw Error('Sign in to use team assignments');
    return data.user;
  }
  function check(result) {if(result.error)throw result.error;return result.data;}
  return {
    async assign({teamId,playerId,play,dueAt=null}) {
      const u=await user();
      if(!teamId||!playerId||!play?.name||!Array.isArray(play.steps)||!play.steps.length||play.steps.length>100)throw Error('Invalid assignment');
      return check(await supabase.from('playlab_assignments').insert({
        team_id:teamId,player_id:playerId,assigned_by:u.id,
        play_name:play.name.slice(0,120),play_snapshot:play,due_at:dueAt
      }).select('id,team_id,player_id,play_name,assigned_at').single());
    },
    async coachAssignments(teamId) {
      await user();
      return check(await supabase.from('playlab_assignments').select('id,team_id,player_id,play_name,assigned_at,due_at').eq('team_id',teamId).order('assigned_at',{ascending:false}));
    },
    async myAssignments(playerId) {
      await user();
      return check(await supabase.from('playlab_assignments').select('id,player_id,play_name,play_snapshot,assigned_at,due_at').eq('player_id',playerId).order('assigned_at',{ascending:false}));
    },
    async recordProgress({assignmentId,playerId,stage,completed=false,correctCount=0,questionCount=0}) {
      await user();
      if(!['Watch','Learn','Practice','Predict','Master'].includes(stage))throw Error('Unknown stage');
      if(!Number.isInteger(correctCount)||!Number.isInteger(questionCount)||correctCount<0||questionCount<correctCount||questionCount>100)throw Error('Invalid counts');
      return check(await supabase.from('playlab_progress').upsert({
        assignment_id:assignmentId,player_id:playerId,stage,completed:!!completed,
        correct_count:correctCount,question_count:questionCount,updated_at:new Date().toISOString()
      },{onConflict:'assignment_id,stage'}).select().single());
    },
    async progress(assignmentId) {
      await user();
      return check(await supabase.from('playlab_progress').select('assignment_id,player_id,stage,completed,correct_count,question_count,updated_at').eq('assignment_id',assignmentId));
    }
  };
}
