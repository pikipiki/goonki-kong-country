import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, SphereGeometry, CapsuleGeometry } from "three";
import { PLUSH_BODY, PINK_NOSE, VIOLET_NOSE } from "./plushGoonk/mesh";
import { FlatEye } from "./plushGoonk/FlatEye";
import { FurPile } from "./plushGoonk/FurPile";
import { Stitching } from "./plushGoonk/Stitching";
import { YellowTuft } from "./plushGoonk/YellowTuft";
import { usePlushFabric } from "./plushGoonk/usePlushFabric";
import { ANIMAL_DESIGNS } from "../game/animals";
import { TEAM_SWAP_DURATION, type Game } from "../game/engine";

const sphere = new SphereGeometry(1, 20, 14);
const arm = new CapsuleGeometry(0.045, 0.19, 6, 12);
export function Goonk({
  pink,
  game,
  companion = false,
  preview = false,
}: {
  pink: boolean;
  game?: Game;
  companion?: boolean;
  preview?: boolean;
}) {
  const fabric = usePlushFabric(pink);
  const root = useRef<Group>(null),
    body = useRef<Group>(null),
    limbs = useRef<(Group | null)[]>([]);
  useFrame(({ clock }) => {
    if (!root.current || !body.current) return;
    const p = game?.player,
      t = clock.elapsedTime;
    const cart = (game?.level.originalTerrain === "mineCart" || (game?.level.biome === "mine" && game?.level.originalTerrain !== "cave"));
    const mount = !companion && game?.mount;
    const swimming = !preview && game?.level.biome === "lagoon" && (!mount || mount.kind === "enguarde");
    const riding = !!mount;
    const walking = preview || cart || riding ? 0 : Math.abs(p?.vx ?? 0);
    const grounded = p?.grounded ?? true;
    const pose = companion ? game?.companion : p;
    const swap = game?.swap;
    const swapU = swap ? 1 - swap.remaining / TEAM_SWAP_DURATION : 0;
    const swapHop = Math.sin(Math.min(1, swapU) * Math.PI);
    if (swap && p && pose) {
      if (companion) {
        const start = swap.back;
        const behindX = p.x - p.facing * 1.25;
        let cx: number;
        let cy: number;
        if (swapU < 0.5) {
          const t = swapU * 2;
          const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
          cx = start.x + (p.x - start.x) * ease;
          cy = start.y + (p.y - start.y) * ease + swapHop * 0.55;
        } else {
          const t = (swapU - 0.5) * 2;
          const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
          cx = p.x + (behindX - p.x) * ease;
          cy = p.y + swapHop * 0.25 * (1 - t);
        }
        root.current.position.set(cx, cy, -0.28 + swapHop * 0.15);
      } else {
        root.current.position.set(
          p.x,
          p.y + swapHop * 1.35,
          0.3 + swapHop * 0.12,
        );
      }
    } else if (pose) {
      root.current.position.set(pose.x, pose.y, companion ? -0.28 : 0.3);
    }
    root.current.scale.setScalar((pink ? 2.2 : 2.05) * (cart ? 0.83 : riding ? .78 : swimming ? 0.85 : 1));
    if (mount && p) root.current.position.set(p.x - p.facing * 0.12,
      p.y + ANIMAL_DESIGNS[mount.kind].seat - 0.03, 0.2);
    if (cart && p)
      root.current.position.set(
        p.x + (companion ? -0.5 : 0.4),
        p.y + 0.92,
        companion ? -0.2 : 0.3,
      );
    root.current.visible = companion
      ? (p?.hp ?? 2) === 2
      : !(p && p.cannon >= 0);
    if (p && !companion && p.invincible > 0)
      root.current.visible = Math.sin(t * 34) > -0.45;
    const roll = !companion && (p?.roll ?? 0) > 0;
    const cannonFlight = !companion && (p?.launched ?? 0) > 0;
    const swapping = swapU > 0 && swapU < 1;
    body.current.rotation.z = roll
      ? -(p?.rollAngle ?? 0) * (p?.rollFacing ?? 1)
      : cannonFlight
        ? t * 14 * (p?.facing ?? 1)
        : swapping
          ? (companion ? -1 : 1) * swapHop * (pink ? 0.35 : 0.85)
          : swimming ? -(pose?.facing ?? 1) * (Math.PI/2 + Math.sin(t*4)*.035) : Math.sin(t * 2.1) * 0.025;
    body.current.rotation.y =
      (pose?.facing ?? 1) * (walking > 0.3 ? 0.65 : 0.2);
    body.current.position.y =
      (roll ? 0.3 : swimming ? 0.26 : 0.4) +
      (grounded
        ? Math.abs(Math.sin(t * walking * 2.1)) *
          Math.min(0.045, walking * 0.01)
        : 0.025);
    body.current.scale.set(
      1,
      grounded && walking > 0.2 ? 1 + Math.sin(t * walking * 4.2) * 0.025 : 1,
      1,
    );
    limbs.current.forEach((limb, i) => {
      if (!limb) return;
      const swing = Math.sin(t * walking * 2.1 + (i % 2) * Math.PI);
      if (swapping) {
        limb.rotation.x = (i < 2 ? -1.1 : 0.65) * swapHop;
        limb.rotation.z =
          (i % 2 ? 1 : -1) * swapHop * (pink ? 0.35 : 1.05);
        return;
      }
      limb.rotation.x =
        walking > 0.1
          ? swing * (i < 2 ? 0.6 : 0.85)
          : Math.sin(t * 1.5 + i) * 0.07;
      if (!grounded) limb.rotation.x = i < 2 ? -0.6 : 0.4;
      if (p && p.carry >= 0 && i < 2 && !companion) limb.rotation.x = -2.3;
      limb.rotation.z = riding ? (i % 2 ? 1 : -1) * (i < 2 ? 0.45 : 0.7) : 0;
      if (riding) limb.rotation.x = i < 2 ? -0.9 : -0.65;
      if (roll) {
        // Rose curls into a roll; Violette extends her limbs into a cartwheel.
        limb.rotation.z = (i % 2 ? 1 : -1) * (pink ? 0.18 : 1.05);
        limb.rotation.x = pink ? -1.4 : 0;
      }
    });
  });
  return (
    <group ref={root} scale={pink ? 2.2 : 2.05}>
      <group ref={body} position={[0, 0.4, 0]}>
        <group position={[0, -0.4, 0]}>
          <mesh
            geometry={PLUSH_BODY}
            material={fabric}
            castShadow
            receiveShadow
            dispose={null}
          />
          <mesh
            geometry={pink ? PINK_NOSE : VIOLET_NOSE}
            material={fabric}
            castShadow
            dispose={null}
          />
          <FurPile pink={pink} />
          <Stitching pink={pink} />
          <FlatEye side={-1} seed={pink ? 1 : 2} />
          <FlatEye side={1} seed={pink ? 1 : 2} />
          {pink && <YellowTuft />}
          {[-1, 1].map((side, i) => (
            <group
              key={side}
              position={[side * 0.28, 0.43, 0]}
              ref={(el) => {
                limbs.current[i] = el;
              }}
            >
              <group rotation={[0, 0, side * 0.25]}>
                <mesh
                  geometry={arm}
                  material={fabric}
                  position={[0, -0.11, 0]}
                  castShadow
                />
                <mesh
                  geometry={sphere}
                  scale={[0.075, 0.064, 0.05]}
                  position={[0, -0.255, 0.015]}
                  material={fabric}
                  castShadow
                />
                {[-1, 0, 1].map((finger) => (
                  <mesh
                    key={finger}
                    geometry={sphere}
                    scale={[0.02, 0.044, 0.022]}
                    position={[finger * 0.038, -0.29, 0.02]}
                    material={fabric}
                  />
                ))}
              </group>
            </group>
          ))}
          {[-1, 1].map((side, i) => (
            <group
              key={side}
              position={[side * 0.145, 0.075, 0.04]}
              ref={(el) => {
                limbs.current[i + 2] = el;
              }}
            >
              <mesh
                geometry={sphere}
                scale={[0.09, 0.055, 0.13]}
                position={[0, -0.02, 0.06]}
                material={fabric}
                castShadow
              />
              {[-1, 0, 1].map((toe) => (
                <mesh
                  key={toe}
                  geometry={sphere}
                  scale={[0.032, 0.032, 0.045]}
                  position={[toe * 0.043, -0.025, 0.16]}
                  material={fabric}
                />
              ))}
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}
