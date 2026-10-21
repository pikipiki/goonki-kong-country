import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CircleGeometry,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
} from "three";
import type { Game } from "../game/engine";
const disk = new CircleGeometry(1, 20),
  ink = new MeshBasicMaterial({
    color: "#081107",
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
export function ContactShadows({ game }: { game: Game }) {
  const root = useRef<InstancedMesh>(null),
    dummy = useMemo(() => new Object3D(), []),
    enemies = game.enemies,
    count = enemies.length + 2;
  useFrame(() => {
    if (!root.current) return;
    const list = [game.player, game.companion, ...enemies];
    for (let i = 0; i < count; i++) {
      const actor = list[i];
      let floor = game.level.originalTerrain ? game.supportAt(actor.x,actor.y,.2) ?? -9 : -9;
      for (const platform of game.level.platforms) {
        const top = game.surface(platform);
        if (
          !game.level.originalTerrain &&
          Math.abs(actor.x - platform.x) < platform.w / 2 &&
          top <= actor.y + 0.2
        )
          floor = Math.max(floor, top);
      }
      const valid =
          floor > -8 &&
          (i !== 1 || game.player.hp === 2) &&
          (i < 2 || enemies[i - 2].alive),
        height = Math.max(0, actor.y - floor),
        scale = valid ? Math.max(0.1, 0.55 - height * 0.055) : 0;
      dummy.position.set(actor.x, floor + 0.015, 0.13);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(scale, 0.42 * scale, 1);
      dummy.updateMatrix();
      root.current.setMatrixAt(i, dummy.matrix);
    }
    root.current.instanceMatrix.needsUpdate = true;
    root.current.computeBoundingSphere();
  });
  return <instancedMesh ref={root} args={[disk, ink, count]} dispose={null} />;
}
