import * as T from '../vendor/three.module.min.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

// CC0 anatomical mesh, dressed before it enters the scene. See player/LICENSE.txt.
export async function createAthlete(scene, profile) {
  const parts = await Promise.all(Array.from({length:9},(_,i)=>fetch(new URL(`../player/athlete-${i}.bin`,import.meta.url)).then(r=>{if(!r.ok)throw Error('Player asset unavailable');return r.arrayBuffer();})));
  const stream = new Blob(parts).stream().pipeThrough(new DecompressionStream('gzip'));
  const data = await new Response(stream).arrayBuffer();
  const gltf = await new GLTFLoader().parseAsync(data,'');
  const model = gltf.scene, player = new T.Group();
  const materials = ['#8d5535','#f45b2a','#171c26','#eeeeea','#211914','#11151c'].map(color=>new T.MeshStandardMaterial({color,roughness:.8}));
  const bones = {}, rest = new Map();
  model.updateMatrixWorld(true);
  model.traverse(o=>{if(o.isBone){bones[o.name]=o;rest.set(o,{q:o.quaternion.clone(),p:o.position.clone(),world:o.getWorldQuaternion(new T.Quaternion())});}});
  model.traverse(o=>{if(!o.isSkinnedMesh)return;const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,idx=g.index.array;const buckets=Array.from({length:6},()=>[]);
    for(let i=0;i<idx.length;i+=3){const a=idx[i],b=idx[i+1],c=idx[i+2];const y=(p.getY(a)+p.getY(b)+p.getY(c))/3,x=Math.abs((p.getX(a)+p.getX(b)+p.getX(c))/3),z=(p.getZ(a)+p.getZ(b)+p.getZ(c))/3;
      let m=0;
      if(y>.64&&y<1.01&&x<.24)m=2;
      else if(y>=1.01&&y<1.39&&x<.205)m=1;
      else if(y<.12)m=3;
      else if(y>1.61)m=4;
      // Conceal the anatomical groin under a separate, smooth uniform panel.
      if(m===2&&x<.085&&z>.085&&y<.88)continue;
      buckets[m].push(a,b,c);
    }
    const indices=[];g.clearGroups();buckets.forEach((b,i)=>{g.addGroup(indices.length,b.length,i);for(const index of b)indices.push(index);});g.setIndex(indices);
    for(let i=0;i<p.count;i++){const y=p.getY(i),x=p.getX(i);if(y>.64&&y<1.01&&Math.abs(x)<.24){p.setX(i,x*1.09);p.setZ(i,Math.min(.13,p.getZ(i)+n.getZ(i)*.019));}else if(y>=1.01&&y<1.39&&Math.abs(x)<.205){p.setXYZ(i,x+n.getX(i)*.012,y,p.getZ(i)+n.getZ(i)*.012);}}
    p.needsUpdate=true;g.computeVertexNormals();o.material=materials;o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;
  });
  player.add(model);scene.add(player);
  const v=(x,y,z)=>new T.Vector3(x,y,z), world=b=>b.getWorldPosition(new T.Vector3());
  function attach(g,m,bone,at){const o=new T.Mesh(g,m);o.castShadow=true;player.add(o);o.position.copy(at);player.updateMatrixWorld(true);bone.attach(o);return o;}
  // Loose fabric bridges the crotch; no exposed anatomical surface is rendered.
  const panel=attach(new T.BoxGeometry(.22,.26,.19),materials[2],bones.pelvis,v(0,.825,.028));
  const shoes=[];
  for(const side of [-1,1]){const suffix=side===1?'l':'r',ankle=world(bones['foot_'+suffix]);
    const sole=attach(new T.CapsuleGeometry(.058,.16,4,12),materials[3],bones['foot_'+suffix],v(ankle.x,.06,.085));sole.quaternion.copy(bones['foot_'+suffix].getWorldQuaternion(new T.Quaternion()).invert().multiply(new T.Quaternion().setFromAxisAngle(v(1,0,0),Math.PI/2)));sole.scale.set(1,.95,.7);shoes.push(sole);
    const trim=attach(new T.BoxGeometry(.11,.035,.22),materials[5],bones['foot_'+suffix],v(ankle.x,.025,.079));
  }
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const texture=new T.CanvasTexture(canvas);
  const number=attach(new T.PlaneGeometry(.17,.17),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}),bones.spine_03,v(0,1.21,.17));number.castShadow=false;
  const hair=attach(new T.SphereGeometry(.088,24,16,0,Math.PI*2,0,Math.PI*.58),materials[4],bones.head,v(0,1.603,.017));hair.scale.set(.96,.85,1.04);
  function appearance(p){materials[0].color.set(p.skin);materials[1].color.set(p.jersey);materials[2].color.set(p.shorts);materials[4].color.set(p.style==='bald'?p.skin:p.hair);hair.visible=p.style!=='bald';hair.scale.y=p.style==='curls'?1.25:.85;player.scale.set(clamp(.94+(p.weight-65)*.0035,.84,1.19)*p.height/168,p.height/168,p.height/168);const ctx=canvas.getContext('2d');ctx.clearRect(0,0,256,256);ctx.fillStyle='#fff';ctx.font='bold 180px Arial';ctx.textAlign='center';ctx.fillText(p.number,128,191);texture.needsUpdate=true;}
  function reset(crouch,lean){for(const [b,r] of rest){b.quaternion.copy(r.q);b.position.copy(r.p);}model.updateMatrixWorld(true);const pos=world(bones.pelvis);pos.y-=crouch;bones.pelvis.position.copy(bones.pelvis.parent.worldToLocal(pos));bones.spine_01.quaternion.multiply(new T.Quaternion().setFromAxisAngle(v(1,0,0),lean));model.updateMatrixWorld(true);}
  function aim(b,child,target){const a=world(b),from=world(child).sub(a).normalize(),to=target.clone().sub(a).normalize();const q=new T.Quaternion().setFromUnitVectors(from,to).multiply(b.getWorldQuaternion(new T.Quaternion()));b.quaternion.copy(b.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q));b.updateMatrixWorld(true);}
  function chain(first,second,end,target,pole){const a=world(first),len1=a.distanceTo(world(second)),len2=world(second).distanceTo(world(end));const d=target.clone().sub(a),r=clamp(d.length(),.03,len1+len2-.003),dir=d.normalize();const along=(len1*len1-len2*len2+r*r)/(2*r);const bend=pole.clone().addScaledVector(dir,-pole.dot(dir)).normalize();const knee=a.clone().addScaledVector(dir,along).addScaledVector(bend,Math.sqrt(Math.max(0,len1*len1-along*along)));aim(first,second,knee);aim(second,end,a.clone().addScaledVector(dir,r));}
  function arm(side,target,wrist=0,curl=.15){const s=side===1?'l':'r',a=bones['upperarm_'+s],b=bones['lowerarm_'+s],hand=bones['hand_'+s];chain(a,b,hand,player.localToWorld(target.clone()),v(side*.65,-.6,.6).transformDirection(player.matrixWorld));const fingerDirection=v(side*.04,-1,.18).applyAxisAngle(v(1,0,0),wrist).normalize();const palm=v(-side,0,0);const axisX=fingerDirection.clone().cross(palm).normalize(),axisZ=axisX.clone().cross(fingerDirection).normalize();const desired=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(axisX,fingerDirection,axisZ));hand.quaternion.copy(hand.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(player.getWorldQuaternion(new T.Quaternion()).multiply(desired)));for(const finger of ['index','middle','ring','pinky'])for(let i=1;i<=3;i++){const f=bones[`${finger}_0${i}_${s}`];f.quaternion.multiply(new T.Quaternion().setFromAxisAngle(v(1,0,0),curl*(i===1?1:.6)));}hand.updateMatrixWorld(true);}
  function leg(side,target,pitch=0){const s=side===1?'l':'r';chain(bones['thigh_'+s],bones['calf_'+s],bones['foot_'+s],player.localToWorld(target.clone()),v(0,0,1).transformDirection(player.matrixWorld));const foot=bones['foot_'+s],toe=bones['ball_'+s];aim(foot,toe,world(foot).add(v(side*.014,-.045,.13).applyAxisAngle(v(1,0,0),pitch).transformDirection(player.matrixWorld).multiplyScalar(.14)));}
  appearance(profile);
  return {player,appearance,reset,arm,leg};
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));


