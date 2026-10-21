import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Group, OrthographicCamera } from "three";
import { Goonk } from "./game3d/Goonk";

// The current seven authored stages, not a claim to the original island layout.
const nodes: [number, number][] = [[-8,3],[-5,-1],[-2,2],[2,4],[5,-3],[1,-5],[8,2]];
const colors = ["#547637", "#345d35", "#6b6252", "#39858c", "#d8e3ce", "#87734e", "#947541"];
function Travelers({ selected, initial }: { selected: number; initial: number }) {
  const root = useRef<Group>(null), at = useRef(initial), destination = useRef(initial), progress = useRef(0);
  useFrame((_, delta) => {
    if (!root.current) return;
    if (destination.current === at.current && at.current !== selected) {
      destination.current = at.current + Math.sign(selected - at.current); progress.current = 0;
    }
    if (destination.current !== at.current) progress.current = Math.min(1, progress.current + delta * 1.5);
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
function MapCamera() {
  const {camera, size} = useThree();
  useEffect(() => {
    const c = camera as OrthographicCamera;
    c.zoom = Math.min(size.width / 26, size.height / 19);
    c.lookAt(0,0,0); c.updateProjectionMatrix();
  }, [camera,size.width,size.height]);
  return null;
}
function Island({ selected, unlocked, onSelect, initial }: {selected:number; unlocked:number; initial:number; onSelect:(i:number)=>void}) {
  return <>
    <color attach="background" args={["#153b43"]}/>
    <hemisphereLight args={["#eddfbc", "#264c39", 2.2]}/>
    <directionalLight position={[-8,15,9]} intensity={3} color="#ffdba2"/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.15,0]}><circleGeometry args={[35,48]}/><meshStandardMaterial color="#24585b" roughness={0.45}/></mesh>
    <mesh position={[0,-2.3,0]} scale={[12,2.5,8]}><icosahedronGeometry args={[1,2]}/><meshStandardMaterial color="#56764a" flatShading/></mesh>
    {nodes.map(([x,z],i) => <group key={i} position={[x,0,z]}>
      <mesh position={[0,-0.4,0]} scale={[2.2,0.7,1.9]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={colors[i]} roughness={0.95}/></mesh>
      {(i===2||i===4||i===5) && <mesh position={[0,0.85,-0.7]} scale={[1.1,i===4?2.2:1.5,1.1]}><coneGeometry args={[1,1.6,7]}/><meshStandardMaterial color={i===4?"#e1e5d8":"#79705a"} flatShading/></mesh>}
      {(i===0||i===1) && [-1,1].map(side=><group key={side} position={[side*0.9,0,-0.65]}>
        <mesh position={[0,0.55,0]}><cylinderGeometry args={[0.1,0.18,1.2,6]}/><meshStandardMaterial color="#79513a"/></mesh>
        <mesh position={[0,1.35,0]} scale={[0.9,0.75,0.9]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#315b31" flatShading/></mesh>
      </group>)}
      <mesh position={[0,0.11,0.4]} rotation={[-Math.PI/2,0,0]}
        onClick={e=>{e.stopPropagation(); if(i<=unlocked)onSelect(i);}}>
        <ringGeometry args={[0.38,0.62,24]}/><meshStandardMaterial color={i>unlocked?"#4b4d3d":i===selected?"#ffce52":"#e2bc6b"} emissive={i===selected?"#8c5c0e":"#000000"}/>
      </mesh>
    </group>)}
    {nodes.slice(1).flatMap((b,i)=>Array.from({length:10},(_,n)=>{
      const a=nodes[i],t=(n+0.5)/10;
      return <mesh key={`${i}-${n}`} position={[a[0]+(b[0]-a[0])*t,0.18,a[1]+(b[1]-a[1])*t]} rotation={[-Math.PI/2,0,0]}>
        <circleGeometry args={[0.085,8]}/><meshBasicMaterial color={i<unlocked?"#e2c07b":"#5f6d57"}/>
      </mesh>;
    }))}
    <Travelers selected={selected} initial={initial}/>
  </>;
}
export function IslandMap({selected,unlocked,onSelect,initial}:{selected:number;unlocked:number;initial:number;onSelect:(i:number)=>void}) {
  return <div className="island-map" aria-label="Carte 3D : Rose et Violette se déplacent entre les étapes">
    <Canvas orthographic dpr={[1,1.25]} camera={{position:[0,18,20],zoom:21,near:0.1,far:100}}
      onCreated={({camera})=>{camera.lookAt(0,0,0);camera.updateProjectionMatrix();}}>
      <MapCamera/>
      <Island selected={selected} unlocked={unlocked} onSelect={onSelect} initial={initial}/>
    </Canvas>
  </div>;
}
