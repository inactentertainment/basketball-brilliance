import * as T from '../vendor/three.module.min.js';

// Garments share the athlete's skeleton, so fabric follows the same joints.
export function dressPlayer(body, materials) {
  const skeleton=body.skeleton, bones=skeleton.bones;
  const joint=name=>bones.findIndex(b=>b.name===name);
  const pelvis=joint('pelvis'), spine1=joint('spine_01'), spine3=joint('spine_03');
  function weights(y,side=0){
    if(side){const blend=T.MathUtils.clamp((.93-y)/.18,0,1);return [[pelvis,1-blend],[joint(side>0?'thigh_l':'thigh_r'),blend]];}
    if(y<1)return [[pelvis,1]];
    const t=T.MathUtils.clamp((y-1.04)/.2,0,1);return [[spine1,1-t],[spine3,t]];
  }
  function surface(rows,cols,point,weight,material){
    const positions=[],uv=[],joints=[],influences=[],indices=[];
    for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
      const p=point(r/rows,c/cols);positions.push(...p);uv.push(c/cols,r/rows);
      const w=weight(p,r/rows,c/cols);for(let i=0;i<4;i++){joints.push(w[i]?.[0]||0);influences.push(w[i]?.[1]||0);}
    }
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(joints,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(influences,4));g.setIndex(indices);g.computeVertexNormals();
    const o=new T.SkinnedMesh(g,material);body.parent.add(o);o.bind(skeleton,body.bindMatrix);o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;return o;
  }
  // Small repeating weave; neutral texture preserves the chosen uniform colors.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#eee';ctx.fillRect(0,0,128,128);
  for(let y=0;y<128;y+=4)for(let x=0;x<128;x+=4){ctx.fillStyle=(x+y)%8?'#e4e4e4':'#fafafa';ctx.fillRect(x,y,2,1);}
  const fabric=new T.CanvasTexture(canvas);fabric.wrapS=fabric.wrapT=T.RepeatWrapping;fabric.repeat.set(7,7);fabric.colorSpace=T.SRGBColorSpace;
  for(const i of [1,2]){materials[i].map=fabric;materials[i].roughness=.94;materials[i].side=T.DoubleSide;materials[i].needsUpdate=true;}
  const trim=new T.MeshStandardMaterial({color:'#f4f0e5',roughness:.84,side:T.DoubleSide});

  function torso(t,u,offset=0){const a=u*Math.PI*2,y=.967+(jerseyTop(a)-.967)*t,w=.174+.034*Math.sin(t*Math.PI*.65),d=.112+.014*t;return [Math.sin(a)*(w+offset),y,.028+Math.cos(a)*(d+offset)];}
  surface(16,64,torso,p=>weights(p[1]),materials[1]);
  // Flat stitched bindings at the collar/armhole contour and bottom hem.
  surface(1,64,(t,u)=>{const p=torso(1,u,.002);p[1]-=t*.009;return p;},p=>weights(p[1]),trim);
  surface(1,64,(t,u)=>{const p=torso(0,u,.002);p[1]+=t*.008;return p;},p=>weights(p[1]),trim);
  for(const side of [-1,1]){
    surface(16,4,(t,u)=>{const y=1.396+.025*Math.sin(t*Math.PI);return [side*(.118+u*.044),y,.125-.200*t];},p=>weights(p[1]),materials[1]);
    // Shorts leg openings move with each thigh, while their waist blends to pelvis.
    surface(12,48,(t,u)=>{const a=u*Math.PI*2,y=.625+.285*t;return [side*(.137-.029*t)+Math.sin(a)*(.105+.016*t),y,.026+Math.cos(a)*(.126+.008*t)];},p=>weights(p[1],side),materials[2]);
    surface(1,48,(t,u)=>{const a=u*Math.PI*2;return [side*.137+Math.sin(a)*.108,.626+t*.01,.026+Math.cos(a)*.129];},p=>weights(p[1],side),trim);
    // Short side stripe, weighted identically to the shorts beneath it.
    surface(10,2,(t,u)=>{const a=side*Math.PI/2+(u-.5)*.12;return [side*(.137-.029*t)+Math.sin(a)*(.107+.016*t),.64+.255*t,.026+Math.cos(a)*(.128+.008*t)];},p=>weights(p[1],side),trim);
  }
  surface(8,64,(t,u)=>{const a=u*Math.PI*2;return [Math.sin(a)*(.214-.037*t),.786+.18*t,.026+Math.cos(a)*.143];},p=>weights(p[1]),materials[2]);
  surface(2,64,(t,u)=>{const a=u*Math.PI*2;return [Math.sin(a)*.181,.947+t*.023,.026+Math.cos(a)*.146];},p=>weights(p[1]),trim);
  return {fabric};
}

export function jerseyTop(theta){const s=Math.abs(Math.sin(theta)),neck=Math.cos(theta)>0?1.355:1.385,ease=x=>x*x*(3-2*x);return s<.65?T.MathUtils.lerp(neck,1.397,ease(s/.65)):T.MathUtils.lerp(1.397,1.235,ease((s-.65)/.35));}
