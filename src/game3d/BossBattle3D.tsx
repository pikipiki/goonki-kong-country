import {bossArenaBounds} from "../game/bossArena";
import {useMemo,useRef,useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import {Group,BoxGeometry,SphereGeometry,ConeGeometry,CylinderGeometry,TorusGeometry,MeshStandardMaterial,DoubleSide,CanvasTexture,SpriteMaterial} from 'three';
import type {Enemy,Game} from '../game/engine';
const box=new BoxGeometry(1,1,1),sphere=new SphereGeometry(1,16,12),cone=new ConeGeometry(1,1,10),cylinder=new CylinderGeometry(1,1,1,16),ring=new TorusGeometry(1,.055,8,24);
const colors=new Map<string,MeshStandardMaterial>();
const mat=(color:string)=>{if(!colors.has(color))colors.set(color,new MeshStandardMaterial({color,roughness:.75}));return colors.get(color)!;};
function Part({at=[0,0,0],size=[1,1,1],color,shape='sphere',rotation=[0,0,0]}:{at?:[number,number,number];size?:[number,number,number];color:string;shape?:'sphere'|'box'|'cone'|'cylinder';rotation?:[number,number,number]}){
 return <mesh position={at} scale={size} rotation={rotation} geometry={{box,sphere,cone,cylinder}[shape]} material={mat(color)} castShadow dispose={null}/>;
}
export function Crown(){return <group name="king-crown">
 <Part color="#e7b538" shape="cylinder" size={[.34,.1,.28]}/>
 {[-1,1].flatMap(side=>[-1,0,1].map(i=><Part key={`${side}-${i}`} color="#ffd66b" shape="cone" at={[i*.23,.18,side*.19]} size={[.08,.36,.08]}/>))}
 <Part color="#b32835" at={[.03,0,.29]} size={[.07,.09,.03]}/>
 </group>;}
export function KingBossModel({enemy,game}:{enemy:Enemy;game?:Game}){
 const root=useRef<Group>(null),crown=useRef<Group>(null),arms=useRef<Group>(null),legs=useRef<Group>(null),cape=useRef<Group>(null);
 useFrame(()=>{
  const s=game?.bossBattle,t=s?.totalTime??enemy.timer,phase=s?.phase??'intro';
  const lying=phase==='fakeDeath'||phase==='dead';
  if(root.current){root.current.rotation.z=lying?-Math.PI/2:phase==='getUp'?-Math.PI/2*Math.max(0,1-(s?.phaseTime??0)):phase==='run'?-.12:phase==='hurt'?.15*Math.sin(t*35):0;root.current.position.y=lying?.55:0;}
  if(crown.current)crown.current.visible=s?.crowned??true;
  arms.current?.children.forEach((arm,i)=>{arm.rotation.z=phase==='throw'?-1.6*Math.min(1,(s?.phaseTime??0)/.65):phase==='rain'?-1.1:phase==='jump'?-.8:Math.sin(t*10+i*Math.PI)*(phase==='run'?.65:.05);});
  legs.current?.children.forEach((leg,i)=>{leg.rotation.z=phase==='run'?Math.sin(t*18+i*Math.PI)*.55:phase==='jump'?.45:0;});
  if(cape.current){cape.current.rotation.z=phase==='run'?.3:phase==='jump'?.5:.1+Math.sin(t*4)*.06;cape.current.scale.y=phase==='jump'?.8:1;}
 });
 return <group ref={root} name="king-boss-model">
  <Part color="#547c37" at={[-.18,.82,0]} size={[.59,.69,.41]}/>
  <Part color="#d8b34a" at={[.17,.72,.08]} size={[.38,.52,.38]}/>
  {[0,1,2,3].map(i=><Part key={i} color="#ad8933" at={[.5,.42+i*.16,.12]} size={[.025,.018,.24]} shape="box"/>)}
  <Part color="#5e8b3a" at={[.18,1.43,0]} size={[.38,.31,.3]}/>
  <Part color="#658f3c" at={[.61,1.22,0]} size={[.49,.21,.31]}/>
  <Part color="#263b1b" at={[.67,1.07,.02]} size={[.4,.04,.27]}/>
  <Part color="#dfbf63" at={[.6,1.02,.02]} size={[.4,.06,.27]}/>
  {[-1,1].map(side=><group key={side}>
   <Part color="#faf0c8" at={[.32,1.54,side*.25]} size={[.14,.16,.08]}/><Part color="#c33d2c" at={[.38,1.54,side*.3]} size={[.065,.08,.025]}/><Part color="#171b11" at={[.4,1.54,side*.32]} size={[.025,.05,.02]}/>
   <Part color="#304f23" at={[.35,1.68,side*.25]} size={[.18,.04,.10]} rotation={[0,0,-.18]}/>
   {[0,1,2].map(i=><Part key={i} color="#fff0b9" shape="cone" at={[.4+i*.18,1.08,side*.27]} size={[.03,.12,.03]} rotation={[0,0,Math.PI]}/>)}
  </group>)}
  <group ref={arms}>{[-1,1].map(side=><group key={side} position={[-.12,1.07,side*.36]}><Part color="#5b8235" at={[.13,-.22,0]} size={[.14,.3,.13]}/><Part color="#638e3a" at={[.28,-.43,0]} size={[.2,.15,.18]}/><Part color="#e1c351" at={[.19,-.32,0]} size={[.16,.06,.16]} shape="cylinder"/></group>)}</group>
  <group ref={legs}>{[-1,1].map(side=><group key={side} position={[-.16,.35,side*.24]}><Part color="#567b32" at={[0,-.05,0]} size={[.24,.29,.23]}/><Part color="#638a36" at={[.25,-.26,.02]} size={[.35,.12,.23]}/>{[0,1,2].map(i=><Part key={i} color="#eadcaa" at={[.54,-.26,(i-1)*.13]} size={[.11,.04,.035]}/>)}</group>)}</group>
  <group ref={cape} position={[-.56,1.23,-.10]}><Part color="#992c2a" at={[-.03,-.5,-.04]} size={[.12,.64,.51]} rotation={[0,0,-.16]}/><Part color="#e6cc7c" at={[0,.03,0]} size={[.16,.09,.47]}/></group>
  {[0,1,2,3,4].map(i=><Part key={i} color="#527c31" at={[-.65-i*.14,.36-i*.04,0]} size={[.2-i*.025,.14-i*.018,.19-i*.025]}/>)}
  <group ref={crown} position={[.15,1.88,0]}><Crown/></group>
 </group>;
}
export function BossProjectiles3D({game}:{game:Game}){
 const root=useRef<Group>(null);
 useFrame(()=>root.current?.children.forEach((g,i)=>{const p=game.bossProjectiles?.[i];g.visible=!!p?.active;if(!p)return;g.position.set(p.x,p.warning>0?.03:p.y,.2);g.rotation.z=p.kind==='crown'?p.rotation:0;g.children[0].visible=p.kind==='crown';g.children[1].visible=p.kind==='cannonball'&&p.warning<=0;
 const hit=(p.impact??0)>0;
 g.children[1].scale.set(hit?.43:.34,hit?.21:.34,hit?.40:.34);
 g.children[1].rotation.z=Math.floor(p.age*12)*Math.PI/8;
 g.children[2].visible=p.kind==='cannonball'&&p.warning>0;g.children[2].scale.setScalar(.6+Math.sin(game.time*18)*.12);}));
 return <group ref={root} name="boss-projectiles">{Array.from({length:32},(_,i)=><group key={i} visible={false}>
  <group scale={.85}><Crown/></group><mesh geometry={sphere} scale={.34} material={mat('#293039')} castShadow/>
  <mesh geometry={ring} rotation={[-Math.PI/2,0,0]}><meshBasicMaterial color="#ffd56d" transparent opacity={.75}/></mesh>
 </group>)}</group>;
}
function FakeCredits({game}:{game:Game}){
 const root=useRef<Group>(null);
 const material=useMemo(()=>{const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d')!;x.fillStyle='#121b17e8';x.fillRect(0,0,512,128);x.fillStyle='#f4d46c';x.font='bold 48px Georgia';x.textAlign='center';x.fillText('KREDITS',256,64);x.font='20px Georgia';x.fillText('THE END…?',256,105);return new SpriteMaterial({map:new CanvasTexture(c),transparent:true,depthTest:false});},[]);
 useEffect(()=>()=>{material.map?.dispose();material.dispose();},[material]);
 useFrame(()=>{if(root.current)root.current.visible=game.bossBattle?.phase==='fakeDeath';});
 return <group ref={root} visible={false} name="boss-fake-credits" position={[11,4,1]}><sprite material={material} scale={[8,2,1]}/></group>;
}
/** The ROM scene frames a gold deck with hanging rigging, port cannons,
 * stacked barrels and the distant island; keep these silhouettes in 3D. */
export function ShipArena({game}:{game:Game}){
 const bounds=bossArenaBounds(game.level.length);
 return <group name="gangplank-galleon-arena">
  {[bounds.left,bounds.right].map(x=><Part key={`edge-${x}`} at={[x,4.4,.1]} size={[.18,9,.2]} color="#6d4b2b" shape="box"/>)}
  <mesh geometry={box} position={[11,-.65,0]} scale={[25,1.2,4.6]} material={mat('#694528')}/>
  {Array.from({length:50},(_,i)=><mesh key={i} geometry={box} position={[-1.25+i*.5,-.045,0]} scale={[.475,.1,4.5]} material={mat(i%3?'#c69a50':'#ae7a36')}/>)}
  <Part at={[11,.65,-2.2]} size={[25,.18,.25]} color="#8d572b" shape="box"/>
  {[-.2,19.5].map(x=><group key={x} position={[x,0,-2.8]}>
   {[0,1,2,3,4,5].map(i=><group key={i} position={[i*.55,0,0]}>
    <Part at={[0,5,0]} size={[.045,8.6,.045]} color="#55432b" shape="box" rotation={[0,0,(i-2.5)*.007]}/>
    <mesh geometry={ring} position={[0,.95,0]} scale={[.13,.26,.13]} material={mat('#715635')}/>
   </group>)}
   {[2,3,4,5,6,7,8].map(y=><Part key={y} at={[1.37,y,0]} size={[2.8,.045,.045]} color="#55432b" shape="box" rotation={[0,0,.03]}/>)}
  </group>)}
  {[.5,21.5].map(x=><group key={x} position={[x,.48,-1.95]}>
   <Part size={[.6,.52,.4]} color="#59452e" shape="box"/>
   <Part at={[0,.35,.17]} size={[.30,1.15,.30]} color="#353636" shape="cylinder" rotation={[Math.PI/2,0,0]}/>
   <mesh geometry={ring} position={[0,.35,.73]} scale={.3} material={mat('#847046')}/>
  </group>)}
  {[[9.8,.46],[11,.46],[12.2,.46],[10.4,1.35],[11.6,1.35],[11,2.24]].map(([x,y],i)=><group key={i} position={[x,y,-2.9]} rotation={[Math.PI/2,0,(i%3-1)*.16]}>
   <Part size={[.55,.65,.55]} color={i%2?'#85542c':'#986738'} shape="cylinder"/>
   {[-.42,.42].map(y=><Part key={y} at={[0,y,0]} size={[.57,.06,.57]} color="#433827" shape="cylinder"/>)}
  </group>)}
  <mesh name="galleon-sea" position={[11,-40,-17]}><planeGeometry args={[200,80]}/><meshBasicMaterial color="#8397b5" fog={false}/></mesh>
  <group name="distant-island" position={[11,0,-30]} scale={.55}>
   <Part at={[0,0,0]} size={[4,1.4,1.5]} color="#627249" shape="cone"/>
   <Part at={[0,1,0]} size={[1.7,3.2,1]} color="#8c8c7c" shape="cone"/>
   {[-.6,.15,.7].map((x,i)=><group key={x} position={[x,2.3+i%2*.6,.1]}>
    <Part size={[.22,.9,.3]} color="#e5e3cf" shape="box"/>
    <Part at={[0,.7,0]} size={[.28,.55,.32]} color="#bac6cd" shape="cone"/>
   </group>)}
  </group>
  <group name="galleon-clouds">
   {Array.from({length:24},(_,i)=><Part key={i} at={[-28+i*3.4,1+Math.sin(i*2)*.7,-37]} size={[5, .8+(i%3)*.3,1]} color={i%3?'#9ca8c2':'#c2cadb'}/>)}
  </group>
  <FakeCredits game={game}/>
 </group>;
}
