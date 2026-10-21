import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BoxGeometry, CatmullRomCurve3, ConeGeometry, ExtrudeGeometry, Group,
  MeshStandardMaterial, Shape, SphereGeometry, TubeGeometry, TorusGeometry, Vector3,
} from 'three';

export type AnimalKind = 'rambi' | 'enguarde' | 'winky' | 'expresso';
type V3 = [number, number, number];
const sphere = new SphereGeometry(1, 20, 14);
const cone = new ConeGeometry(1, 1, 12);
const box = new BoxGeometry(1, 1, 1);
const chargeRing = new TorusGeometry(.65, .025, 6, 32);
const palette = new Map<string, MeshStandardMaterial>();
function mat(color: string) {
  if (!palette.has(color)) palette.set(color, new MeshStandardMaterial({ color, roughness: .69, metalness: 0 }));
  return palette.get(color)!;
}
function Part({ color, at = [0, 0, 0], size = [1, 1, 1], rotate = [0, 0, 0], shape = 'sphere' }: {
  color: string; at?: V3; size?: V3; rotate?: V3; shape?: 'sphere' | 'cone' | 'box';
}) {
  return <mesh position={at} scale={size} rotation={rotate} geometry={shape === 'cone' ? cone : shape === 'box' ? box : sphere} material={mat(color)} castShadow dispose={null} />;
}
function tube(points: V3[], radius: number) {
  return new TubeGeometry(new CatmullRomCurve3(points.map(p => new Vector3(...p))), 16, radius, 8, false);
}
function fin(points: [number, number][]) {
  const shape = new Shape();
  shape.moveTo(...points[0]);
  points.slice(1).forEach(p => shape.lineTo(...p));
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth: .045, bevelEnabled: true, bevelSize: .025, bevelThickness: .018, bevelSegments: 2, steps: 1, curveSegments: 6 });
  geometry.translate(0, 0, -.0225);
  return geometry;
}
const rhinoTail = tube([[-.77, .94, 0], [-1.03, .87, 0], [-1.11, .58, .03]], .045);
const ostrichNeck = tube([[.30, 1.35, 0], [.56, 1.59, 0], [.53, 1.96, 0], [.69, 2.20, 0]], .105);
const fishDorsal = fin([[-.42, .8], [-.13, 1.31], [.15, .83], [.42, .74]]);
const fishTail = fin([[-1.02, .64], [-1.5, 1.18], [-1.36, .65], [-1.55, .11], [-1.05, .48]]);
const fishSideFin = fin([[.02, .59], [-.43, .21], [.27, .49]]);
const frogMouth = tube([[.20, .63, .30], [.45, .54, .29], [.67, .61, .24]], .018);
// A tapered, curved horn is substantially more readable than a straight cone.
const mainHorn = (() => {
  const curve = new CatmullRomCurve3([new Vector3(1.02, .90, 0), new Vector3(1.25, 1.03, 0), new Vector3(1.39, 1.30, 0), new Vector3(1.42, 1.56, 0)]);
  const geometry = new TubeGeometry(curve, 18, 1, 12, false);
  const positions = geometry.attributes.position;
  for (let ring = 0; ring <= 18; ring++) {
    const center = curve.getPointAt(ring / 18);
    const radius = .155 * Math.pow(1 - ring / 18, .85) + .002;
    for (let side = 0; side <= 12; side++) {
      const index = ring * 13 + side;
      positions.setXYZ(index, center.x + (positions.getX(index) - center.x) * radius, center.y + (positions.getY(index) - center.y) * radius, center.z + (positions.getZ(index) - center.z) * radius);
    }
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
})();

function Eyes({ at, size = .11, iris = '#4b2520', yellow = false }: { at: V3; size?: number; iris?: string; yellow?: boolean }) {
  return <>{[-1, 1].map(side => <group key={side} position={[at[0], at[1], side * at[2]]}>
    <Part color={yellow ? '#f4d94a' : '#faf1d8'} size={[size, size * 1.16, size * .54]} />
    <Part color={iris} at={[size * .25, 0, side * size * .47]} size={[size * .49, size * .69, size * .24]} />
    <Part color="#101410" at={[size * .36, 0, side * size * .64]} size={[size * .23, size * .45, size * .12]} />
    <Part color="#fffbee" at={[size * .45, size * .35, side * size * .72]} size={[size * .16, size * .20, size * .08]} />
  </group>)}</>;
}
function Rambi() {
  return <group>
    <Part color="#747b7b" at={[-.12, .86, 0]} size={[.86, .49, .44]} />
    <Part color="#8b9191" at={[.37, .95, 0]} size={[.49, .51, .43]} />
    <Part color="#616a6a" at={[-.66, .80, 0]} size={[.30, .40, .36]} />
    <mesh geometry={rhinoTail} material={mat('#687171')} dispose={null} />
    <Part color="#333c3c" at={[-1.10, .57, .03]} size={[.075, .11, .07]} />
    {[-1, 1].flatMap(side => [-1, 1].map(front => <group key={`${side}-${front}`} name="animal-stride" position={[front === 1 ? .40 : -.62, .56, side * .28]} userData={{ phase: side * front > 0 ? 0 : Math.PI, amplitude: .37 }}>
      <Part color={side > 0 ? '#7b8383' : '#606b6d'} at={[0, -.19, 0]} size={[.19, .29, .18]} />
      <Part color="#687373" at={[.065, -.44, .015]} size={[.22, .12, .19]} />
      {[-1, 0, 1].map(toe => <Part key={toe} color="#cbc6b4" at={[.23, -.455, toe * .105]} size={[.075, .055, .044]} />)}
    </group>))}
    <group name="animal-attack" position={[.53, .93, 0]}>
      <Part color="#899291" size={[.39, .34, .32]} />
      <Part color="#919a97" at={[.31, -.13, 0]} size={[.40, .23, .32]} />
      <Part color="#525f5c" at={[.46, -.10, .25]} size={[.045, .035, .025]} />
      <Part color="#525f5c" at={[.46, -.10, -.25]} size={[.045, .035, .025]} />
      <mesh geometry={mainHorn} material={mat('#eee3bf')} position={[-.53, -.93, 0]} dispose={null} />
      <Part color="#dbd0ae" at={[.20, .20, 0]} size={[.11, .24, .11]} rotate={[0, 0, -.28]} shape="cone" />
      <Eyes at={[.10, .14, .285]} size={.10} iris="#bd332a" />
      <Part color="#626d69" at={[-.06, .23, .25]} size={[.17, .045, .095]} rotate={[0, 0, -.17]} />
      {[-1, 1].map(side => <group key={side} position={[-.25, .28, side * .25]} rotation={[side * .45, 0, .32]}>
        <Part color="#747f7a" size={[.11, .20, .085]} />
        <Part color="#a4a79d" at={[.025, .015, side * .055]} size={[.05, .12, .025]} />
      </group>)}
    </group>
  </group>;
}
function Enguarde() {
  return <group>
    <Part color="#277eaf" at={[-.15, .66, 0]} size={[.91, .33, .29]} />
    <Part color="#7ecbd6" at={[-.03, .49, .025]} size={[.73, .16, .255]} />
    <Part color="#348dc1" at={[.51, .70, 0]} size={[.35, .29, .26]} />
    <Part color="#1a6295" at={[1.12, .72, 0]} size={[.085, .99, .075]} rotate={[0, 0, -Math.PI / 2]} shape="cone" />
    <Part color="#66b5d3" at={[.87, .64, 0]} size={[.38, .043, .09]} />
    <mesh geometry={fishDorsal} material={mat('#d8b54d')} dispose={null} />
    {[-1, 1].map(side => <group key={side} name="animal-fin" position={[0, 0, side * .23]} userData={{ phase: side > 0 ? 0 : Math.PI, axis: 'x' }}>
      <mesh geometry={fishSideFin} material={mat('#e8ca63')} rotation={[side * .50, 0, 0]} dispose={null} />
    </group>)}
    <group name="animal-tail" position={[-.95, .63, 0]}>
      <Part color="#2776a1" at={[-.08, 0, 0]} size={[.26, .11, .10]} />
      <mesh geometry={fishTail} material={mat('#e1c153')} position={[.95, -.63, 0]} dispose={null} />
    </group>
    <Eyes at={[.52, .83, .218]} size={.13} iris="#275680" />
    <Part color="#164e79" at={[.76, .675, .14]} size={[.17, .012, .018]} rotate={[0, 0, .04]} />
    <Part color="#164e79" at={[.76, .675, -.14]} size={[.17, .012, .018]} rotate={[0, 0, .04]} />
  </group>;
}
function Winky() {
  return <group>
    <Part color="#4b8d31" at={[-.16, .56, 0]} size={[.58, .39, .40]} />
    <Part color="#d8d39a" at={[.16, .40, .02]} size={[.34, .25, .34]} />
    <Part color="#5a9e37" at={[.27, .73, 0]} size={[.45, .28, .38]} />
    <Part color="#80a74a" at={[.48, .59, 0]} size={[.27, .12, .34]} />
    <mesh geometry={frogMouth} material={mat('#334e27')} dispose={null} />
    {[-1, 1].map(side => <group key={side}>
      <Part color="#427c2c" at={[.21, .94, side * .24]} size={[.19, .25, .18]} />
      <Part color="#e2c94c" at={[.31, 1.00, side * .29]} size={[.13, .18, .12]} />
      <Part color="#171e11" at={[.38, 1.015, side * .36]} size={[.046, .11, .036]} />
      <Part color="#f8f0c2" at={[.40, 1.08, side * .38]} size={[.02, .03, .015]} />
      <group name="animal-stride" position={[-.39, .44, side * .33]} userData={{ phase: side > 0 ? 0 : Math.PI, amplitude: .3 }}>
        <Part color="#4a8e2c" at={[-.13, -.01, 0]} size={[.29, .26, .21]} rotate={[0, 0, -.4]} />
        <Part color="#619d36" at={[-.08, -.24, .02]} size={[.30, .095, .15]} />
        <Part color="#8eab45" at={[.13, -.32, .045]} size={[.34, .075, .20]} />
        {[-1, 0, 1].map(toe => <Part key={toe} color="#b2bf5c" at={[.39, -.32, toe * .12]} size={[.12, .042, .035]} />)}
      </group>
      <group name="animal-stride" position={[.31, .48, side * .30]} userData={{ phase: side > 0 ? Math.PI : 0, amplitude: .16 }}>
        <Part color="#5b9534" at={[.09, -.16, .015]} size={[.075, .24, .07]} rotate={[0, 0, .34]} />
        <Part color="#a2b651" at={[.18, -.36, .045]} size={[.20, .053, .12]} />
      </group>
    </group>)}
  </group>;
}
function Expresso() {
  return <group>
    <Part color="#252c2c" at={[-.14, 1.30, 0]} size={[.59, .39, .38]} />
    <Part color="#e9e5d1" at={[.12, 1.15, 0]} size={[.35, .23, .32]} />
    <Part color="#f1eddb" at={[-.67, 1.48, 0]} size={[.32, .17, .22]} rotate={[0, 0, -.33]} />
    <Part color="#d9d9c7" at={[-.72, 1.34, 0]} size={[.28, .13, .21]} rotate={[0, 0, .14]} />
    <mesh geometry={ostrichNeck} material={mat('#d89b87')} dispose={null} />
    <Part color="#e5ac94" at={[.73, 2.22, 0]} size={[.22, .24, .20]} />
    <Part color="#dd985b" at={[1.00, 2.17, 0]} size={[.10, .40, .11]} rotate={[0, 0, -Math.PI / 2]} shape="cone" />
    <Part color="#9d6441" at={[.97, 2.13, .055]} size={[.21, .014, .08]} />
    <Eyes at={[.78, 2.29, .165]} size={.095} iris="#466c91" />
    <Part color="#eeeece" at={[.63, 2.42, 0]} size={[.14, .08, .14]} />
    {[-1, 1].map(side => <group key={side}>
      <group name="animal-wing" position={[-.12, 1.40, side * .32]} userData={{ phase: side > 0 ? 0 : Math.PI, side }}>
        <Part color="#f4f0db" at={[-.14, -.10, side * .045]} size={[.42, .19, .12]} rotate={[side * .10, 0, -.17]} />
        {[-1, 0, 1].map(feather => <Part key={feather} color={feather === 0 ? '#fff9e7' : '#e1dfcc'} at={[-.35 + feather * .07, -.17 + feather * .08, side * .08]} size={[.23, .07, .065]} rotate={[0, 0, .35 + feather * .15]} />)}
      </group>
      <group name="animal-stride" position={[.05, 1.12, side * .19]} userData={{ phase: side > 0 ? 0 : Math.PI, amplitude: .75 }}>
        <Part color="#cf9984" at={[-.04, -.23, 0]} size={[.055, .30, .055]} rotate={[0, 0, -.15]} />
        <Part color="#dbab90" at={[-.075, -.64, 0]} size={[.045, .23, .045]} rotate={[0, 0, .12]} />
        <Part color="#e2e7d5" at={[.03, -.85, 0]} size={[.10, .10, .10]} />
        <Part color="#ac3441" at={[.14, -.98, 0]} size={[.28, .13, .13]} />
        <Part color="#f5eacb" at={[.16, -1.065, .005]} size={[.29, .044, .14]} />
        <Part color="#e5d8b7" at={[.29, -.965, side * .11]} size={[.085, .035, .018]} />
      </group>
    </group>)}
  </group>;
}

/** Original DKC buddy silhouettes. Origin is the ground, forward is +X. */
export function AnimalModel({ kind, moving = false, attacking = false, time = 0, motion }: {
  kind: AnimalKind; moving?: boolean; attacking?: boolean; time?: number; motion?: () => {moving:boolean;attacking:boolean;gliding:boolean;charging:number};
}) {
  const root = useRef<Group>(null), windup = useRef<Group>(null);
  const animated = useRef<Group[]>([]);
  const metadata = useMemo(() => ({kind}), [kind]);
  useLayoutEffect(() => {
    animated.current = [];
    root.current?.traverse(node => { if (node instanceof Group && node.name.startsWith('animal-')) animated.current.push(node); });
  }, [kind]);
  useFrame(({ clock }) => {
    const t = time || clock.elapsedTime;
    const state=motion?.(), move=state?.moving ?? moving, attack=state?.attacking ?? attacking, glide=state?.gliding ?? false;
    const charge = Math.min(1, (state?.charging ?? 0) / .65);
    const ready = charge >= 1;
    if (root.current) {
      root.current.position.x = -charge * .16 + (charge ? Math.sin(t * (ready ? 46 : 26)) * .025 * charge : 0);
      root.current.position.y = kind === 'rambi' ? -charge * .10 : glide ? Math.sin(t * 20) * .035 : charge ? Math.sin(t * 28) * .025 : 0;
      root.current.rotation.z = kind === 'enguarde' ? charge * .08 : 0;
      root.current.scale.set(1 + (attack ? .08 : charge * .03), 1 - charge * .06, 1);
      root.current.userData.animation = glide ? 'flutter' : charge ? ready ? 'ready' : 'charging' : attack ? 'attack' : move ? 'moving' : 'idle';
    }
    if (windup.current) {
      windup.current.visible = charge > .04;
      windup.current.scale.setScalar(.65 + charge * .35 + Math.sin(t * (ready ? 22 : 12)) * .04);
      windup.current.rotation.z = t * 2;
    }
    for (const group of animated.current) {
      const phase = group.userData.phase || 0;
      if (group.name === 'animal-stride') {
        group.rotation.z = charge && kind === 'rambi'
          ? Math.sin(t * (ready ? 30 : 18) + phase) * .22 * charge
          : Math.sin(t * (kind === 'expresso' ? 15 : 10) + phase) * (move ? group.userData.amplitude : .025);
      } else if (group.name === 'animal-tail') group.rotation.y = Math.sin(t * (charge ? 24 : attack ? 22 : move ? 10 : 4)) * (charge ? .55 : move ? .32 : .13);
      else if (group.name === 'animal-fin') group.rotation.x = Math.sin(t * (charge || attack ? 22 : 7) + phase) * (charge ? .55 : .13);
      else if (group.name === 'animal-wing') {
        group.rotation.x = group.userData.side * (glide ? .85 + Math.sin(t * 20) * .55 : Math.sin(t * 6) * .07);
        // Profile-view silhouette needs a visible up/down stroke as well.
        group.rotation.z = glide ? -.2 + Math.sin(t * 20) * .65 : 0;
        group.scale.setScalar(glide ? 1.3 : 1);
      } else if (group.name === 'animal-attack') group.rotation.z = attack ? -.30 : -charge * .25;
    }
  });
  return <group ref={root} name="animal-model" userData={metadata} dispose={null}>
    <group ref={windup} name="animal-charge-windup" visible={false} position={[0,.8,.52]}>
      <mesh geometry={chargeRing}><meshBasicMaterial color="#ffe395" transparent opacity={.75} depthWrite={false}/></mesh>
      {[0,1,2].map(i=><mesh key={i} geometry={box} position={[-.82,.25-i*.25,0]} scale={[.2,.035,.025]}><meshBasicMaterial color="#ffe395"/></mesh>)}
    </group>
    {kind === 'rambi' ? <Rambi /> : kind === 'enguarde' ? <Enguarde /> : kind === 'winky' ? <Winky /> : <Expresso />}
  </group>;
}
