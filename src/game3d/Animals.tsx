import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BoxGeometry, MeshStandardMaterial, Group } from "three";
import type { Animal } from "../game/animals";
import type { Game } from "../game/engine";
import { AnimalModel } from "./AnimalModels";

const box = new BoxGeometry(1, 1, 1);
const wood = new MeshStandardMaterial({ color: "#9b6535", roughness: 0.93 });
const dark = new MeshStandardMaterial({ color: "#5c351f", roughness: 0.9 });
const metal = new MeshStandardMaterial({ color: "#71654a", metalness: 0.35, roughness: 0.7 });
function Buddy({ animal, game }: { animal: Animal; game: Game }) {
  const root = useRef<Group>(null), crate = useRef<Group>(null), model = useRef<Group>(null);
  useFrame(() => {
    if (!root.current || !crate.current || !model.current) return;
    root.current.visible = Math.abs(animal.x - game.player.x) < 22 && animal.y > -7;
    root.current.position.set(animal.x, animal.y, 0);
    const boxed = animal.state === "crate";
    crate.current.visible = boxed;
    model.current.scale.setScalar(boxed ? 0.42 : 1);
    model.current.position.set(0, boxed ? 0.36 : 0, boxed ? 0.62 : 0);
    model.current.rotation.y = animal.facing < 0 ? Math.PI : 0;
  });
  return <group ref={root}>
    <group ref={crate}>
      <mesh geometry={box} material={dark} position={[0, 0.65, -0.13]} scale={[1.45, 1.3, 1.05]} dispose={null}/>
      {[-0.54, -0.18, 0.18, 0.54].map(x => <mesh key={x} geometry={box} material={wood} position={[x, 0.65, 0.42]} scale={[0.32, 1.3, 0.11]} dispose={null}/>)}
      {[0.1, 1.19].map(y => <mesh key={y} geometry={box} material={metal} position={[0, y, 0.5]} scale={[1.53, 0.13, 0.12]} dispose={null}/>)}
      <mesh geometry={box} material={wood} position={[0, 0.66, 0.53]} scale={[1.32, 0.13, 0.1]} rotation={[0, 0, -0.65]} dispose={null}/>
    </group>
    <group ref={model}>
      <AnimalModel kind={animal.kind} moving={animal.state === "fleeing" || (animal.state === "ridden" && Math.abs(game.player.vx) > 0.2)} attacking={animal.state === "ridden" && game.player.mountAttack > 0}/>
    </group>
  </group>;
}
export function Animals({ game }: { game: Game }) {
  return <>{game.animals.map((animal, i) => <Buddy key={i} animal={animal} game={game}/>)}</>;
}
