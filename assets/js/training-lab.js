// Basketball Brilliance Training Lab. Local avatar/circuit preferences only.
const root=document.getElementById('training-lab');
window.addEventListener('load',()=>{const q=new URLSearchParams(location.search);if(q.get('training')==='1'&&!q.has('invite')){const entering=enterPortal('player');requestAnimationFrame(()=>root.scrollIntoView({block:'start',behavior:'instant'}));entering.then(()=>clearTimeout(portalOfferTimer));}});
const $=id=>root.querySelector('#'+id);
const drills=[
 {id:'pound',name:'Stationary pound',type:'Ball handling',length:1.2,rep:'30 seconds each hand',cues:['Set a comfortable athletic stance with your knees bent.','Push the ball down beside your hip; receive it with relaxed fingers.','Keep your eyes forward and repeat with your other hand.'],note:'Start under control. Build pace while keeping the ball close.'},
 {id:'cross',name:'Front crossover',type:'Ball handling',length:1.6,rep:'20 controlled changes',cues:['Start low with your feet wider than your hips.','Push the ball across in front of your knees.','Receive with the other hand and shift your weight with the ball.'],note:'Watch the hand change from the front camera.'},
 {id:'cones',name:'Cone change of direction',type:'Movement',length:8,rep:'4 passes through the cones',cues:['Approach each cone under control.','Change hands and direction outside the cone.','Push into the next space, keeping your eyes up.'],note:'The court camera shows the full route. Begin at walking pace.'},
 {id:'form',name:'Close-range form shot',type:'Shooting',length:4,rep:'10 deliberate attempts',cues:['Balance your feet and bring the ball above your shooting elbow.','Extend through your legs and shooting arm; keep the guide hand light.','Finish with your wrist relaxed and hold your follow-through.'],note:'Use the side camera to study the gather, release, and follow-through.'},
 {id:'pullup',name:'One-dribble pull-up',type:'Shooting',length:5,rep:'5 attempts each hand',cues:['Take one controlled dribble toward your shooting spot.','Gather with two hands and set your feet under you.','Rise balanced, release, and land under control.'],note:'This demonstration shows a straight-line approach into a balanced shot.'},
 {id:'slides',name:'Defensive slides',type:'Footwork',length:3,rep:'3 rounds of 20 seconds',cues:['Sit into an athletic stance with your chest up.','Push from your trailing foot and lead with the foot nearest your direction.','Keep your feet from crossing and stay balanced as you reverse.'],note:'Use the front camera to study the feet and stance.'}
];
const defaults={name:'My Player',height:175,weight:70,skin:'#8d5535',hair:'#211914',style:'crop',jersey:'#f45b2a',shorts:'#171c26',number:15,hand:'right'};
let profile={...defaults},circuit=[],active=drills[0],playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,time=0,speed=1,circuitRun=null,sceneReady=false,resetPose=()=>{};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function cleanProfile(p){const color=(x,d)=>/^#[0-9a-f]{6}$/i.test(x||'')?x:d;return {name:String(p.name||defaults.name).slice(0,24),height:clamp(Number(p.height)||175,130,220),weight:clamp(Number(p.weight)||70,35,140),skin:color(p.skin,defaults.skin),hair:color(p.hair,defaults.hair),style:['crop','curls','bald'].includes(p.style)?p.style:'crop',jersey:color(p.jersey,defaults.jersey),shorts:color(p.shorts,defaults.shorts),number:clamp(Math.round(Number(p.number)||0),0,99),hand:p.hand==='left'?'left':'right'};}
try{const p=JSON.parse(localStorage.getItem('bb-training-avatar-v1'));if(p)profile=cleanProfile(p);const c=JSON.parse(localStorage.getItem('bb-training-circuit-v1'));if(Array.isArray(c))circuit=c.filter(x=>drills.some(d=>d.id===x.id)).slice(0,12).map(x=>({id:x.id,seconds:clamp(Number(x.seconds)||30,10,180)}));}catch{}
root.innerHTML=`<div class="wrap"><div class="tl-head"><div><span class="tl-label">Basketball Brilliance / Player development</span><h2>Training Lab</h2><p>Build your player. See the skill. Practice with purpose.</p></div><span class="tl-badge">Prototype 3 · Tailored player</span></div><div class="tl-layout"><aside class="tl-panel tl-avatar"><h3>Create your player</h3><small>Make a player like you. Appearance settings personalize the demonstration.</small><div class="tl-avatar-fields"><label>Player name<input id="tl-name" maxlength="24"></label><label>Height <output id="tl-height-value"></output><input id="tl-height" type="range" min="130" max="220" value="175"></label><label>Weight <output id="tl-weight-value"></output><input id="tl-weight" type="range" min="35" max="140" value="70"></label><label>Skin tone<input id="tl-skin" type="color"></label><label>Hair color<input id="tl-hair" type="color"></label><label>Hairstyle<select id="tl-style"><option value="crop">Short crop</option><option value="curls">Curls</option><option value="bald">Bald</option></select></label><label>Jersey color<input id="tl-jersey" type="color"></label><label>Shorts color<input id="tl-shorts" type="color"></label><label>Jersey number<input id="tl-number" type="number" min="0" max="99"></label><label>Preferred hand<select id="tl-hand"><option value="right">Right</option><option value="left">Left</option></select></label></div><button class="tl-btn primary" id="tl-save">Save my player</button> <button class="tl-btn" id="tl-reset">Reset</button><div class="tl-status" id="tl-avatar-status" role="status"></div><small>Saved in this browser. Height and weight change the avatar’s proportions, not your real-world ability.</small></aside><div class="tl-viewer"><div class="tl-stage-shell"><div class="tl-stage" id="tl-stage" role="img" aria-label="Interactive 3D basketball drill demonstration" tabindex="0"><div class="tl-stage-top"><b id="tl-player-label"></b><b id="tl-stage-label">Stationary pound</b></div><div class="tl-stage-note">Drag left/right to orbit · Use camera presets for close views</div><div class="tl-error" id="tl-loading"><p>Preparing your court…</p></div></div><div class="tl-controls"><button class="tl-btn primary" id="tl-play">Pause</button><button class="tl-btn" id="tl-replay">Replay</button><label>Speed<select id="tl-speed"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1×</option></select></label><label>Camera<select id="tl-camera"><option value="front">Front</option><option value="side">Side</option><option value="back">Behind</option><option value="court">Full court</option><option value="hands">Hands &amp; release</option><option value="feet">Feet &amp; ankles</option></select></label><input id="tl-progress" class="tl-progress" type="range" min="0" max="1000" step="1" value="0" aria-label="Scrub drill demonstration"></div></div><div id="tl-drills" class="tl-drills"></div><div class="tl-cue"><span class="tl-label" id="tl-rep"></span><h3 id="tl-drill-title"></h3><p id="tl-drill-note"></p><ol id="tl-cues"></ol></div></div></div><div class="tl-bottom"><div class="tl-panel"><h3>Design your practice</h3><small>Combine demonstrations into your own timed circuit. Adjust each station from 10 to 180 seconds.</small><div class="tl-circuit-row"><label style="flex:1">Drill<select id="tl-circuit-drill"></select></label><label>Seconds<input id="tl-seconds" type="number" min="10" max="180" value="30"></label><button class="tl-btn" id="tl-add">Add drill</button></div><ol class="tl-circuit-list" id="tl-circuit-list"></ol><button class="tl-btn primary" id="tl-start-circuit">Start circuit</button> <button class="tl-btn" id="tl-save-circuit">Save circuit</button> <button class="tl-btn" id="tl-stop-circuit" disabled>Stop</button><div class="tl-status" id="tl-circuit-status" role="status"></div></div><div class="tl-panel"><h3>See it. Then try it.</h3><small>1. Choose a skill and read the coaching cues.<br><br>2. Watch from the front and side. Slow it down or pause at a key moment.<br><br>3. Practice at your own pace with a ball and a safe space. Use the circuit to guide your session.<br><br>This prototype uses an articulated human model and handcrafted demonstration motion. Have your coach review the movement and adapt it to you. It does not evaluate your body, track real makes, or grade your technique.</small></div></div><p class="tl-footer">Your avatar and saved circuit stay on this device. This lab does not record your camera or upload your appearance settings. More skills and finer animation can be added as the drill library develops.</p></div>`;
function fields(){for(const key of Object.keys(defaults))$('tl-'+key).value=profile[key];updateLabels();}
function updateLabels(){const inches=Math.round(profile.height/2.54);$('tl-height-value').textContent=`${Math.floor(inches/12)}′ ${inches%12}″ / ${profile.height} cm`;$('tl-weight-value').textContent=`${Math.round(profile.weight*2.20462)} lb / ${profile.weight} kg`;$('tl-player-label').textContent=profile.name+' · #'+profile.number;}
fields();
for(const key of Object.keys(defaults))$('tl-'+key).addEventListener('input',()=>{profile=cleanProfile(Object.fromEntries(Object.keys(defaults).map(k=>[k,$('tl-'+k).value])));updateLabels();resetPose();$('tl-avatar-status').textContent='Unsaved changes';});
$('tl-save').onclick=()=>{try{localStorage.setItem('bb-training-avatar-v1',JSON.stringify(profile));$('tl-avatar-status').textContent='Player saved on this device.';}catch{$('tl-avatar-status').textContent='Saving is unavailable in this browser. You can still use the player.';}};
$('tl-reset').onclick=()=>{profile={...defaults};fields();resetPose();$('tl-avatar-status').textContent='Default player restored. Save to keep these changes.';};
function choose(id,manual=true){if(manual&&circuitRun)stopCircuit('Circuit stopped.');active=drills.find(d=>d.id===id)||drills[0];time=0;$('tl-stage-label').textContent=active.name;$('tl-drill-title').textContent=active.name;$('tl-rep').textContent=active.type+' / '+active.rep;$('tl-drill-note').textContent=active.note;$('tl-cues').replaceChildren(...active.cues.map(s=>{const li=document.createElement('li');li.textContent=s;return li;}));root.querySelectorAll('.tl-drill').forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===id?'true':'false'));$('tl-progress').value=0;}
for(const d of drills){const b=document.createElement('button');b.className='tl-drill';b.dataset.id=d.id;b.setAttribute('aria-pressed','false');const s=document.createElement('span');s.textContent=d.type;const t=document.createElement('b');t.textContent=d.name;b.append(s,t);b.onclick=()=>choose(d.id);$('tl-drills').append(b);const o=document.createElement('option');o.value=d.id;o.textContent=d.name;$('tl-circuit-drill').append(o);}
choose(active.id);
function syncPlay(){$('tl-play').textContent=playing?'Pause':'Play';$('tl-play').setAttribute('aria-label',playing?'Pause demonstration':'Play demonstration');}syncPlay();
$('tl-play').onclick=()=>{playing=!playing;syncPlay();};$('tl-replay').onclick=()=>{time=0;};$('tl-speed').onchange=e=>speed=Number(e.target.value);$('tl-progress').oninput=e=>{time=active.length*Number(e.target.value)/1000;playing=false;syncPlay();};
function renderCircuit(){$('tl-circuit-list').replaceChildren(...circuit.map((x,i)=>{const li=document.createElement('li');li.textContent=`${drills.find(d=>d.id===x.id).name} · ${x.seconds}s `;const b=document.createElement('button');b.textContent='Remove';b.setAttribute('aria-label','Remove station '+(i+1));b.onclick=()=>{stopCircuit('');circuit.splice(i,1);renderCircuit();};li.append(b);return li;}));$('tl-start-circuit').disabled=!circuit.length||!sceneReady||!!circuitRun;}
function stopCircuit(message){circuitRun=null;$('tl-stop-circuit').disabled=true;$('tl-circuit-status').textContent=message;renderCircuit();}
$('tl-add').onclick=()=>{if(circuit.length>=12){$('tl-circuit-status').textContent='A circuit can contain up to 12 stations.';return;}stopCircuit('');circuit.push({id:$('tl-circuit-drill').value,seconds:clamp(Number($('tl-seconds').value)||30,10,180)});renderCircuit();};
$('tl-save-circuit').onclick=()=>{try{localStorage.setItem('bb-training-circuit-v1',JSON.stringify(circuit));$('tl-circuit-status').textContent='Circuit saved on this device.';}catch{$('tl-circuit-status').textContent='Saving is unavailable in this browser.';}};
$('tl-start-circuit').onclick=()=>{if(!circuit.length||!sceneReady)return;circuitRun={index:0,elapsed:0};playing=true;choose(circuit[0].id,false);syncPlay();$('tl-stop-circuit').disabled=false;renderCircuit();};$('tl-stop-circuit').onclick=()=>stopCircuit('Circuit stopped.');renderCircuit();
const visible=()=>document.body.dataset.portal==='player'&&!document.hidden&&root.getBoundingClientRect().bottom>0&&root.getBoundingClientRect().top<innerHeight;
async function init(){
 const T=await import('../vendor/three.module.min.js');
 const stage=$('tl-stage'),scene=new T.Scene();scene.background=new T.Color('#182731');scene.fog=new T.Fog('#182731',15,38);
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;stage.prepend(renderer.domElement);
 renderer.domElement.addEventListener('webglcontextrestored',()=>{$('tl-loading').hidden=true;});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();playing=false;syncPlay();$('tl-loading').hidden=false;$('tl-loading').textContent='The 3D view was interrupted. Reload the page to restore it.';});
 const camera=new T.PerspectiveCamera(42,1,.1,70);let angle=0,distance=4.5,elevation=2.4;
 scene.add(new T.HemisphereLight(0xe1f1ff,0x54515b,2.5));const sun=new T.DirectionalLight(0xffddbc,3.5);sun.position.set(-5,10,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-10;sun.shadow.camera.right=10;sun.shadow.camera.top=10;sun.shadow.camera.bottom=-10;sun.shadow.bias=-.0006;scene.add(sun);
 const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.85});const courtMat=mat('#3b6266'),paint=mat('#b46845'),white=new T.LineBasicMaterial({color:'#dfd8c3'}),skin=mat(profile.skin),jersey=mat(profile.jersey),shorts=mat(profile.shorts),hair=mat(profile.hair),shoe=mat('#eae8e1'),black=mat('#22242a');
 function mesh(g,m,parent=scene){const o=new T.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function box(w,h,d,m,x,y,z,parent=scene){const o=mesh(new T.BoxGeometry(w,h,d),m,parent);o.position.set(x,y,z);return o;}
 function line(points){const g=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p)));const l=new T.Line(g,white);scene.add(l);return l;}
 box(17,.15,18,courtMat,0,-.1,-2);box(3.6,.01,5,paint,0,-.014,-4.5);
 line([[-7,.005,6],[7,.005,6],[7,.005,-10],[-7,.005,-10],[-7,.005,6]]);line([[-1.8,.01,-7],[-1.8,.01,-2],[1.8,.01,-2],[1.8,.01,-7]]);const arc=[];for(let i=0;i<=80;i++){const a=i/80*Math.PI;arc.push([Math.cos(a)*5.8,.012,-6.8+Math.sin(a)*5.8]);}line(arc);
 const hoop=new T.Group();hoop.position.set(0,0,-5);scene.add(hoop);box(.12,3.6,.12,black,0,1.8,-.5,hoop);box(1.8,1.05,.08,mat('#dce4e5'),0,3.5,-.45,hoop);box(.65,.43,.012,mat('#364f56'),0,3.42,-.399,hoop);box(.53,.32,.012,mat('#e7ecec'),0,3.42,-.39,hoop);const rim=mesh(new T.TorusGeometry(.23,.022,8,40),mat('#f45b2a'),hoop);rim.rotation.x=Math.PI/2;rim.position.set(0,3.05,0);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;const g=new T.BufferGeometry().setFromPoints([new T.Vector3(Math.cos(a)*.23,3.03,Math.sin(a)*.23-5),new T.Vector3(Math.cos(a)*.13,2.68,Math.sin(a)*.13-5)]);scene.add(new T.Line(g,new T.LineBasicMaterial({color:'#e0dfd6'})));}
 // Simple neighborhood geometry keeps this functional 3D court light enough for phones.
 for(let i=0;i<9;i++){const h=3+(i%4)*1.1;box(2,h,2.5,mat(i%2?'#263a46':'#30424b'),-12+i*3,h/2,-14);}
 for(const side of [-1,1]){for(let z=-9;z<=6;z+=3)box(.055,2.2,.055,black,side*7.7,1.1,z);for(let y=.4;y<=2.2;y+=.35)box(.025,.025,15,mat('#78858b'),side*7.7,y,-1.5);}
 const cones=new T.Group();scene.add(cones);for(let i=0;i<4;i++){const c=mesh(new T.ConeGeometry(.18,.45,16),mat('#ff8a39'),cones);c.position.set(i%2?.55:-.55,.225,1.7-i*1.1);}
 const {createAthlete}=await import('./athlete.js?build=3');
 const athlete=await createAthlete(scene,profile),player=athlete.player;
 const ball=mesh(new T.SphereGeometry(.12,24,20),mat('#d76a22'));const seamMat=new T.MeshBasicMaterial({color:'#372b23'});for(const rot of [[0,0,0],[Math.PI/2,0,0],[0,Math.PI/2,0]]){const s=mesh(new T.TorusGeometry(.1205,.0025,4,48),seamMat,ball);s.rotation.set(...rot);}
 const V=(x,y,z)=>new T.Vector3(x,y,z),ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
 resetPose=()=>athlete.appearance(profile);
 function pose(){
   const t=time%active.length,p=t/active.length,h=profile.hand==='left'?1:-1;
   let x=0,z=0,jump=0,crouch=.1,lean=.08,flight=false,flightU=0,wristL=0,wristR=0;
   let ballLocal=V(h*.34,.65,.24),left=V(-.36,1.05,.19),right=V(.36,1.05,.19);
   let poseL={},poseR={},contactSide=0,contactWeight=0,releaseStart=null,falling=null,heading=0;
   let ankleL=V(-.23,.075,.02),ankleR=V(.23,.075,.02),pitchL=0,pitchR=0;
   cones.visible=active.id==='cones';ball.visible=active.id!=='slides';
   const dribbleHand=(side,center)=>{const target=center.clone().add(V(0,.13,-.085));target.y=Math.max(.62,target.y);const options={fingers:V(0,-.08,1),palm:V(0,-1,0),elbow:V(side*.25,-1,.3)};if(side===1){right=target;poseR=options;}else{left=target;poseL=options;}contactSide=side;contactWeight=ease((center.y-.56)/.16);};
   if(active.id==='pound'){const b=.12+.63*Math.abs(Math.cos(p*Math.PI));ballLocal=V(h*.35,b,.28);dribbleHand(h,ballLocal);const sway=Math.sin(p*Math.PI*2)*.012;crouch=.105+sway;}
   if(active.id==='cross'){const a=p*Math.PI*2;ballLocal=V(.38*Math.cos(a),.12+.55*Math.abs(Math.cos(a)),.33);crouch=.16;lean=.10;const side=ballLocal.x>=0?1:-1;dribbleHand(side,ballLocal);if(side===1)left=V(-.3,.82,.3);else right=V(.3,.82,.3);}
   if(active.id==='cones'){
     const route=u=>({x:.62*Math.sin(u*Math.PI*4),z:1.6*Math.cos(u*Math.PI*2),yaw:Math.atan2(.62*4*Math.PI*Math.cos(u*Math.PI*4),-1.6*2*Math.PI*Math.sin(u*Math.PI*2))});
     const current=route(p);x=current.x;z=current.z;heading=current.yaw;crouch=.10;lean=.06;
     const foot=(side,offset)=>{const cycle=p*12+offset,k=Math.floor(cycle),u=cycle-k,start=(k-offset+.3)/12,end=start+1/12,swing=ease((u-.60)/.40);
       const point=g=>{const f=route(g);return V(f.x+side*.18*Math.cos(f.yaw),.075,f.z-side*.18*Math.sin(f.yaw));};
       const target=point(start).lerp(point(end),swing);const dx=target.x-x,dz=target.z-z;
       return V((dx*Math.cos(heading)-dz*Math.sin(heading))/player.scale.x,.075+(u>.6?Math.sin((u-.6)/.4*Math.PI)*.065:0),(dx*Math.sin(heading)+dz*Math.cos(heading))/player.scale.z);
     };
     ankleL=foot(-1,0);ankleR=foot(1,.5);pitchL=-Math.max(0,ankleL.y-.075)*3;pitchR=-Math.max(0,ankleR.y-.075)*3;
     const side=Math.sin(p*Math.PI*4)>=0?h:-h;ballLocal=V(side*.34,.12+.63*Math.abs(Math.cos(p*Math.PI*12)),.27);dribbleHand(side,ballLocal);
   }
   if(active.id==='slides'){
     // Discrete lead/trail steps. A planted foot keeps the same court position
     // as the pelvis moves; only the swinging foot advances and lifts.
     const k=p*4,index=Math.floor(k),u=k-index,dir=index<2?1:-1,start=[-.4,0,.4,0][index],end=start+dir*.4;
     const center=start+(end-start)*ease((u-.12)/.76);x=center;crouch=.22+.014*Math.sin(u*Math.PI*2);lean=.12;
     const lead=ease(u/.48),trail=ease((u-.52)/.48),leadX=start+dir*.28+dir*.4*lead,trailX=start-dir*.28+dir*.4*trail;
     const leadLift=u<.48?Math.sin(u/.48*Math.PI)*.055:0,trailLift=u>.52?Math.sin((u-.52)/.48*Math.PI)*.035:0;
     const a=V(leadX-center,.075+leadLift,.015),b=V(trailX-center,.075+trailLift,.015);
     if(dir===1){ankleR=a;ankleL=b;pitchR=-leadLift*3;pitchL=trailLift*3;}else{ankleL=a;ankleR=b;pitchL=-leadLift*3;pitchR=trailLift*3;}
     left=V(-.49,1.12,.18);right=V(.49,1.12,.18);poseL={fingers:V(-.55,.18,.8),palm:V(0,0,1),elbow:V(-1,-.2,.2)};poseR={fingers:V(.55,.18,.8),palm:V(0,0,1),elbow:V(1,-.2,.2)};
   }
   const shot=active.id==='form'||active.id==='pullup';
   if(shot){
     z=active.id==='form'?-2.65:-1.15;const approach=active.id==='pullup'?.2:0;
     if(p<approach){const u=p/approach;z=-.55-.6*ease(u);ballLocal=V(h*.34,.12+.62*Math.abs(Math.cos(u*Math.PI)),.28);dribbleHand(h,ballLocal);const lift=Math.sin(u*Math.PI)*.045;ankleL.y+=lift;ankleL.z=.1*(1-ease(u));ankleR.z=-ankleL.z;}
     else{
       const q=(p-approach)/(1-approach),gather=ease(q/.22),rise=ease((q-.22)/.15),release=.37,settle=ease((q-.82)/.18);
       const lift=q>.24&&q<.57?Math.sin((q-.24)/.33*Math.PI)*.09:0;
       crouch=.17*(1-ease((q-.12)/.23))+.055*Math.sin(ease((q-.55)/.15)*Math.PI)+.025*Math.sin(settle*Math.PI);lean=.025;jump=lift;
       ballLocal=V(h*.095,1.00+.47*gather+.36*rise,.33-.085*rise);
       let shooting=ballLocal.clone().add(V(h*.02,-.09,-.06)),guide=ballLocal.clone().add(V(-h*.125,-.015,-.005));
       let shotFingers=V(0,.92,-.25),shotPalm=V(0,.35,1),guideFingers=V(0,1,.10);
       if(q>=release&&q<.82){
         flight=true;flightU=(q-release)/.45;
         const snap=ease((q-release)/.065),guideAway=ease((q-release)/.16);
         shooting=V(h*.115,1.75+.02*Math.sin(snap*Math.PI),.185);
         guide=V(-h*(.03+.27*guideAway),1.815-.5*guideAway,.23);
         shotFingers=V(0,.92-1.75*snap,-.25+1.03*snap).normalize();shotPalm=V(0,.35,1);
         releaseStart=V(h*.095,1.83,.245);
       }
       if(q>=.82){
         // Finish the ball's flight below the hoop; hands reset empty.
         falling=settle;shooting=V(h*.115,1.75,.185).lerp(V(h*.31,1.00,.24),settle);guide=V(-h*.3,1.28,.23).lerp(V(-h*.31,1.00,.24),settle);
         shotFingers=V(0,-.83,.78);guideFingers=V(0,-.6,.7);
       }
       const shotOptions={fingers:shotFingers,palm:shotPalm,elbow:V(h*.10,-1,.16)},guideOptions={fingers:guideFingers,palm:V(h,0,0),elbow:V(-h*.7,-.5,.35)};
       if(h===1){right=shooting;left=guide;poseR=shotOptions;poseL=guideOptions;}else{left=shooting;right=guide;poseL=shotOptions;poseR=guideOptions;}
       // The guide hand opens before the wrist snaps. Both feet extend together.
       pitchL=pitchR=q>.22&&q<.56?-.18*Math.sin((q-.22)/.34*Math.PI):0;
     }
   }
   player.position.set(x,jump,z);player.rotation.y=shot?Math.PI:heading;player.updateMatrixWorld(true);
   athlete.reset(crouch,lean);athlete.leg(-1,ankleL,pitchL);athlete.leg(1,ankleR,pitchR);
   athlete.arm(-1,left,wristL,flight?.10:.14,poseL);athlete.arm(1,right,wristR,flight?.10:.14,poseR);
   player.updateMatrixWorld(true);
   if(contactWeight>0&&!shot){const contact=athlete.handPosition(contactSide).add(V(0,-.13,.085));ballLocal.lerp(contact,contactWeight);}
   if(flight){const start=player.localToWorld(releaseStart);start.y+=.09*Math.sin((.37-.24)/.33*Math.PI)-jump;ball.position.copy(start).lerp(V(0,3.05,-5),flightU);ball.position.y+=Math.sin(flightU*Math.PI)*.88;}
   else if(falling!==null)ball.position.set(0,3.05-2.7*falling,-5);
   else ball.position.copy(player.localToWorld(ballLocal));
   ball.rotation.x=t*3;ball.rotation.z=t*1.5;
   const close=cameraMode==='hands'||cameraMode==='feet';const focusZ=close?z:-1.2,targetY=cameraMode==='hands'?1.7:cameraMode==='feet'?.48:1.15;
   const viewAngle=angle+(shot&&cameraMode==='hands'?Math.PI:0);camera.position.set(x*(close?1:0)+Math.sin(viewAngle)*distance,elevation,Math.cos(viewAngle)*distance+focusZ);camera.lookAt(close?x:0,targetY,focusZ);
 }
 let cameraMode='front';
 $('tl-camera').onchange=e=>{const mode=e.target.value;cameraMode=mode;angle={front:0,side:Math.PI/2,back:Math.PI,court:.55,hands:.35,feet:.25}[mode];distance=mode==='court'?12:mode==='hands'?2.05:mode==='feet'?2.4:4.5;elevation=mode==='court'?7:mode==='hands'?2.25:mode==='feet'?.9:2.4;};
 let drag=null;renderer.domElement.addEventListener('pointerdown',e=>{drag={x:e.clientX,angle};renderer.domElement.setPointerCapture(e.pointerId);});renderer.domElement.addEventListener('pointermove',e=>{if(drag)angle=drag.angle+(drag.x-e.clientX)*.007;});renderer.domElement.addEventListener('pointerup',()=>drag=null);renderer.domElement.addEventListener('pointercancel',()=>drag=null);
 stage.addEventListener('keydown',e=>{if(e.target!==stage)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){angle+=(e.key==='ArrowLeft'?-1:1)*.15;e.preventDefault();}if(e.key===' '){playing=!playing;syncPlay();e.preventDefault();}});
 function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}}new ResizeObserver(resize).observe(stage);resize();
 $('tl-loading').hidden=true;sceneReady=true;renderCircuit();
 let last=performance.now(),counter=-1;function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.1);last=now;if(!visible())return;if(playing){time+=dt*speed;if(circuitRun){circuitRun.elapsed+=dt;const station=circuit[circuitRun.index];if(circuitRun.elapsed>=station.seconds){circuitRun.index++;circuitRun.elapsed=0;if(circuitRun.index>=circuit.length){stopCircuit('Circuit complete. Nice work!');playing=false;syncPlay();}else choose(circuit[circuitRun.index].id,false);}if(circuitRun){const remaining=Math.ceil(circuit[circuitRun.index].seconds-circuitRun.elapsed);if(remaining!==counter){counter=remaining;$('tl-circuit-status').textContent=`Station ${circuitRun.index+1}/${circuit.length} · ${remaining}s remaining`;}}}}pose();$('tl-progress').value=(time%active.length)/active.length*1000;renderer.render(scene,camera);}requestAnimationFrame(frame);
}
// Load the 3D renderer only when the player approaches the lab.
let initializing=false;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!initializing){initializing=true;observer.disconnect();init().catch(e=>{console.error('Training Lab could not start',e);$('tl-loading').hidden=false;$('tl-loading').replaceChildren();const p=document.createElement('p');p.textContent='The 3D court could not load. Try a current browser with hardware acceleration enabled, then reload. Drill instructions and circuit planning remain available.';$('tl-loading').append(p);$('tl-play').disabled=true;$('tl-replay').disabled=true;});}},{rootMargin:'200px'});observer.observe(root);
