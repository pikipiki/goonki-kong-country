import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Group, OrthographicCamera, Vector3 } from "three";
import { Goonk } from "./game3d/Goonk";
import { useTranslation } from "react-i18next";
import { tr } from "./i18n";
import { tx } from "./i18n/resolveText";

// Seven adapted destinations. Alternate rows leave room for readable labels;
// portrait follows a winding vertical trail instead of shrinking the island.
const wideNodes: [number, number][] = [[-10,3],[-7,-2],[-3.5,3],[0,-2],[3.5,3],[7,-2],[10,3]];
const tallNodes: [number, number][] = [[-4.5,-8],[4.5,-5],[-4.5,-2],[4.5,1],[-4.5,4],[4.5,7],[-4.5,10]];
const colors = ["#547637", "#345d35", "#6b6252", "#39858c", "#d8e3ce", "#87734e", "#947541"];
type Destination = {name:string;subtitle:string};
type MapProps = {selected:number;unlocked:number;initial:number;onSelect:(i:number)=>void;onConfirm:()=>void;stages:Destination[]};

function Travelers({ selected, initial, nodes }: { selected: number; initial: number; nodes:[number,number][] }) {
  const root = useRef<Group>(null), at = useRef(initial), destination = useRef(initial), progress = useRef(0);
  useFrame((_, delta) => {
    if (!root.current) return;
    if (destination.current === at.current && at.current !== selected) {
      destination.current = at.current + Math.sign(selected - at.current); progress.current = 0;
    }
    if (destination.current !== at.current) progress.current = Math.min(1, progress.current + delta * 2.7);
    const a = nodes[at.current], b = nodes[destination.current], t = progress.current;
    const ease = t * t * (3 - 2 * t);
    root.current.position.set(a[0] + (b[0] - a[0]) * ease, 0.3, a[1] + (b[1] - a[1]) * ease);
    if (t === 1) { at.current = destination.current; progress.current = 0; }
  });
  return <group ref={root}>
    <group scale={0.58}><Goonk pink preview /></group>
    <group position={[-0.85,0,-0.35]} scale={0.51}><Goonk pink={false} preview /></group>
  </group>;
}
function Island({ selected, unlocked, onSelect, initial, onProject }: Omit<MapProps,'onConfirm'> & {onProject:(points:{x:number;y:number}[])=>void}) {
  const {camera,size}=useThree();
  const portrait=size.width<600 && size.height>size.width*.8;
  const nodes=portrait?tallNodes:wideNodes;
  useLayoutEffect(()=>{
    const c=camera as OrthographicCamera;
    c.zoom=portrait?Math.min(size.width/18,size.height/23):Math.min(size.width/27,size.height/10.5);
    c.lookAt(0,0,portrait?1:0);c.updateProjectionMatrix();c.updateMatrixWorld();
    onProject(nodes.map(([x,z])=>{
      const point=new Vector3(x,.1,z-1.55).project(c);
      return {x:(point.x+1)*size.width/2,y:(1-point.y)*size.height/2};
    }));
  },[camera,size.width,size.height,portrait,nodes,onProject]);
  return <>
    <color attach="background" args={["#153b43"]}/>
    <hemisphereLight args={["#eddfbc", "#264c39", 2.2]}/>
    <directionalLight position={[-8,15,9]} intensity={3} color="#ffdba2"/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.15,0]}><circleGeometry args={[35,48]}/><meshStandardMaterial color="#24585b" roughness={0.45}/></mesh>
    <mesh position={[0,-2.3,portrait?1:0]} scale={portrait?[7,2.5,12]:[13,2.5,6]}><icosahedronGeometry args={[1,2]}/><meshStandardMaterial color="#56764a" flatShading/></mesh>
    {nodes.map(([x,z],i) => <group key={i} position={[x,0,z]}>
      <mesh position={[0,-0.4,0]} scale={[2.2,0.7,1.9]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={colors[i]} roughness={0.95}/></mesh>
      {(i===2||i===4||i===5) && <mesh position={[0,0.85,-0.7]} scale={[1.1,i===4?2.2:1.5,1.1]}><coneGeometry args={[1,1.6,7]}/><meshStandardMaterial color={i===4?"#e1e5d8":"#79705a"} flatShading/></mesh>}
      {(i===0||i===1) && [-1,1].map(side=><group key={side} position={[side*0.9,0,-0.65]}>
        <mesh position={[0,0.55,0]}><cylinderGeometry args={[0.1,0.18,1.2,6]}/><meshStandardMaterial color="#79513a"/></mesh>
        <mesh position={[0,1.35,0]} scale={[0.9,0.75,0.9]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#315b31" flatShading/></mesh>
      </group>)}
      <mesh position={[0,0.11,0.4]} rotation={[-Math.PI/2,0,0]} onClick={e=>{e.stopPropagation();if(i<=unlocked)onSelect(i);}}>
        <ringGeometry args={[0.38,0.62,24]}/><meshStandardMaterial color={i>unlocked?"#4b4d3d":i===selected?"#ffce52":"#e2bc6b"} emissive={i===selected?"#8c5c0e":"#000000"}/>
      </mesh>
    </group>)}
    {nodes.slice(1).flatMap((b,i)=>Array.from({length:10},(_,n)=>{
      const a=nodes[i],t=(n+.5)/10;
      return <mesh key={`${i}-${n}`} position={[a[0]+(b[0]-a[0])*t,.18,a[1]+(b[1]-a[1])*t]} rotation={[-Math.PI/2,0,0]}>
        <circleGeometry args={[.085,8]}/><meshBasicMaterial color={i<unlocked?"#e2c07b":"#5f6d57"}/>
      </mesh>;
    }))}
    <Travelers selected={selected} initial={initial} nodes={nodes}/>
  </>;
}
export function IslandMap(props:MapProps) {
  useTranslation();
  const root=useRef<HTMLDivElement>(null),[positions,setPositions]=useState<{x:number;y:number}[]>([]);
  const onProject=useCallback((points:{x:number;y:number}[])=>setPositions(points),[]);
  useEffect(()=>{root.current?.focus({preventScroll:true});},[]);
  return <div ref={root} className="island-map" role="group" tabIndex={0} aria-label={tr("islandMapAria")} aria-describedby="map-instructions" onKeyDown={event=>{
    const direction=event.key==='ArrowRight'||event.key==='ArrowDown'?1:event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:0;
    if(direction){event.preventDefault();props.onSelect((props.selected+direction+props.stages.length)%props.stages.length);}
    else if(event.key==='Home'||event.key==='End'){event.preventDefault();props.onSelect(event.key==='Home'?0:props.stages.length-1);}
    else if(event.key==='Enter'){event.preventDefault();props.onConfirm();}
  }}>
    <Canvas orthographic dpr={[1,1.25]} camera={{position:[0,26,13],zoom:21,near:.1,far:100}} onCreated={({camera})=>{camera.lookAt(0,0,0);camera.updateProjectionMatrix();}}>
      <Island {...props} onProject={onProject}/>
    </Canvas>
    <div className="map-labels">
      {positions.map((position,i)=><div className="map-label-anchor" key={i} style={{left:position.x,top:position.y}}>
        <button type="button" className={`map-stage${i===props.selected?' selected':''}`} aria-label={`${i+1}. ${tx(props.stages[i].name)}`} aria-pressed={i===props.selected} disabled={i>props.unlocked} onClick={()=>props.onSelect(i)}>
          <span className="map-stage-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span>
          <span>{tx(props.stages[i].name)}</span>
        </button>
      </div>)}
    </div>
  </div>;
}
