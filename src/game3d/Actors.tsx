import { memo, useMemo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  Group,
  Sprite,
  SpriteMaterial,
  SphereGeometry,
  TorusGeometry,
  CylinderGeometry,
  BoxGeometry,
  ConeGeometry,
  DoubleSide,
} from "three";
import { BananaModel } from "./BananaModel";
import { ContactShadows } from "./ContactShadows";
import { EnemyModel } from "./EnemyModels";
import type { Game, Enemy } from "../game/engine";
const sphere = new SphereGeometry(1, 16, 12),
  box = new BoxGeometry(1, 1, 1),
  cylinder = new CylinderGeometry(0.45, 0.45, 0.95, 16),
  ring = new TorusGeometry(0.455, 0.035, 6, 24);
function textTexture(text: string, color: string, bg?: string) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const context = c.getContext("2d")!;
  if (bg) {
    context.fillStyle = bg;
    context.roundRect(0, 0, 256, 128, 16);
    context.fill();
  }
  context.fillStyle = color;
  context.font = "900 74px Georgia";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 128, 65);
  return new CanvasTexture(c);
}
export function Label({
  text,
  color = "#ffecab",
  bg,
  scale = 1,
  position = [0, 0, 0],
}: {
  text: string;
  color?: string;
  bg?: string;
  scale?: number;
  position?: [number, number, number];
}) {
  const texture = useMemo(
    () => textTexture(text, color, bg),
    [text, color, bg],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={position} scale={[scale * 2, scale, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}
export function Barrel({
  kind = "throw",
}: {
  kind?: "throw" | "rescue" | "checkpoint" | "cannon";
}) {
  const color =
    kind === "rescue"
      ? "#c47aa6"
      : kind === "checkpoint"
        ? "#568c72"
        : "#a47b46";
  return (
    <group position={[0, 0.5, 0]}>
      <mesh geometry={cylinder} castShadow>
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {[-0.32, 0.32].map((y) => (
        <mesh
          key={y}
          geometry={ring}
          position={[0, y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial
            color={kind === "rescue" ? "#f5c1d9" : "#4d5654"}
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, n) => (
        <mesh
          key={n}
          geometry={box}
          position={[
            Math.sin((n * Math.PI) / 4) * 0.448,
            0,
            Math.cos((n * Math.PI) / 4) * 0.448,
          ]}
          rotation={[0, (n * Math.PI) / 4, 0]}
          scale={[0.013, 0.86, 0.015]}
        >
          <meshStandardMaterial color="#685336" />
        </mesh>
      ))}
      <Label
        text={
          kind === "rescue"
            ? "♥"
            : kind === "checkpoint"
              ? "✓"
              : kind === "cannon"
                ? "↗"
                : "✦"
        }
        scale={0.55}
        position={[0, 0, 0.48]}
        color="#fff0c6"
      />
    </group>
  );
}
function Pickups({ game }: { game: Game }) {
  const items = game.level.pickups;
  const root = useRef<Group>(null);
  useFrame(({ clock }) =>
    root.current?.children.forEach((object, i) => {
      const item = items[i];
      if (!item) {
        object.visible = false;
        return;
      }
      object.visible =
        !game.collected.has(i) && Math.abs(item.x - game.player.x) < 22;
      object.position.y = item.y + Math.sin(clock.elapsedTime * 2 + i) * 0.1;
      if (item.kind === "banana")
        object.rotation.y = Math.sin(clock.elapsedTime * 1.4 + i) * 0.42;
    }),
  );
  return (
    <group ref={root}>
      {items.map((item, i) => (
        <group key={i} position={[item.x, item.y, 0.3]}>
          {item.kind === "banana" ? (
            <BananaModel />
          ) : item.kind === "letter" ? (
            <group>
              <mesh
                rotation={[0, 0, Math.PI / 4]}
                geometry={box}
                scale={[0.72, 0.72, 0.12]}
              >
                <meshStandardMaterial
                  color="#b79042"
                  metalness={0.45}
                  roughness={0.3}
                />
              </mesh>
              <Label
                text={item.letter ?? ""}
                position={[0, 0, 0.15]}
                scale={0.62}
              />
            </group>
          ) : (
            <>
              <mesh geometry={sphere} scale={[0.35, 0.44, 0.26]}>
                <meshStandardMaterial color="#ef91ad" roughness={0.28} />
              </mesh>
              <Label text="1" position={[0, 0, 0.3]} scale={0.35} />
              <mesh
                geometry={box}
                position={[0, -0.8, 0]}
                scale={[0.01, 0.8, 0.01]}
              >
                <meshStandardMaterial color="#ddd3ad" />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
}

function BonusPickups({ game }: { game: Game }) {
  const rooms = game.level.bonusRooms;
  if (!rooms?.length) return null;
  return (
    <group>
      {rooms.map((room, roomIndex) => {
        if (!game.brokenWalls.has(room.wallIndex)) return null;
        return (
          <group key={roomIndex}>
            <mesh
              position={[
                room.bounds.x + room.bounds.w / 2,
                room.bounds.y,
                -0.45,
              ]}
              scale={[room.bounds.w, 0.06, room.bounds.h]}
            >
              <meshStandardMaterial
                color="#c9a83a"
                transparent
                opacity={0.28}
                emissive="#8a7030"
                emissiveIntensity={0.15}
              />
            </mesh>
            {room.pickups.map((item, pickupIndex) => {
              const key = `${roomIndex}-${pickupIndex}`;
              if (game.collectedBonus.has(key)) return null;
              return (
                <group
                  key={key}
                  position={[item.x, item.y, 0.25]}
                  visible={Math.abs(item.x - game.player.x) < 24}
                >
                  {item.kind === "banana" ? (
                    <BananaModel />
                  ) : item.kind === "balloon" ? (
                    <>
                      <mesh geometry={sphere} scale={[0.35, 0.44, 0.26]}>
                        <meshStandardMaterial color="#ef91ad" roughness={0.28} />
                      </mesh>
                      <Label text="1" position={[0, 0, 0.3]} scale={0.35} />
                    </>
                  ) : null}
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

function OriginalLevelProps({ game }: { game: Game }) {
  const level = game.level;
  const sparkle = useMemo(() => textTexture("✦", "#ffe6a5"), []);
  useEffect(() => () => sparkle.dispose(), [sparkle]);
  const caches = level.itemCaches;
  const walls = level.breakableWalls;
  const decors = level.decors;
  if (!caches?.length && !walls?.length && !decors?.length) return null;
  return (
    <group>
      {walls?.map((wall, i) =>
        game.brokenWalls.has(i) ? null : (
          <mesh
            key={`wall-${i}`}
            geometry={box}
            position={[wall.x, wall.y + wall.h / 2, 0]}
            scale={[wall.w, wall.h, 0.35]}
          >
            <meshStandardMaterial color="#4a4038" roughness={0.95} />
          </mesh>
        ),
      )}
      {caches?.map((cache, i) => {
        if (game.collectedCaches.has(i)) return null;
        const revealed = game.revealedCaches.has(i);
        return (
          <group key={`cache-${i}`} position={[cache.x, cache.y, 0.2]}>
            <mesh geometry={box} scale={[0.55, 0.45, 0.25]}>
              <meshStandardMaterial color={revealed ? "#c9a227" : "#3d2817"} />
            </mesh>
            {revealed ? (
              <Label text="!" position={[0, 0.35, 0.15]} scale={0.28} />
            ) : null}
          </group>
        );
      })}
      {decors?.map((decor, i) => (
        <group key={`decor-${i}`} position={[decor.x, decor.y, 0.15]}>
          {decor.kind === "butterfly" ? (
            <mesh geometry={sphere} scale={[0.14, 0.09, 0.05]}>
              <meshStandardMaterial color="#ffb6c8" emissive="#331122" />
            </mesh>
          ) : null}
          {decor.kind === "token" ? (
            <mesh
              geometry={cylinder}
              scale={[0.35, 0.12, 0.35]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <meshStandardMaterial color="#e8c84a" metalness={0.7} />
            </mesh>
          ) : null}
          {decor.kind === "sign" ? (
            <>
              <mesh geometry={box} position={[0, 0.5, 0]} scale={[0.08, 1, 0.08]}>
                <meshStandardMaterial color="#6b4a2a" />
              </mesh>
              <mesh
                geometry={box}
                position={[0.15, 0.85, 0]}
                scale={[0.5, 0.35, 0.06]}
              >
                <meshStandardMaterial color="#8d6840" />
              </mesh>
            </>
          ) : null}
          {decor.kind === "sparkle" ? (
            <sprite position={[0, 0, 0]} scale={[0.4, 0.4, 1]}>
              <spriteMaterial
                map={sparkle}
                transparent
                depthWrite={false}
              />
            </sprite>
          ) : null}
        </group>
      ))}
    </group>
  );
}

export const Actors = memo(function Actors({ game }: { game: Game }) {
  const level = game.level;
  const barrels = useRef<Group>(null),
    carried = useRef<Group>(null),
    cart = useRef<Group>(null),
    projectiles = useRef<Group>(null),
    fx = useRef<Group>(null);
  const texture = useMemo(() => textTexture("✦", "#ffe6a5"), []);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame(({ clock }) => {
    barrels.current?.children.forEach((obj, i) => {
      const b = level.barrels[i];
      if (!b) {
        obj.visible = false;
        return;
      }
      obj.visible = !game.usedBarrels.has(i);
      if (b.kind === "cannon") obj.rotation.z = game.cannonAngle(i, level) - Math.PI / 2;
    });
    if (carried.current) {
      carried.current.visible = game.player.carry >= 0;
      carried.current.position.set(game.player.x, game.player.y + 1.9, 0.2);
    }
    if (cart.current) {
      cart.current.visible = game.level.biome === "mine";
      cart.current.position.set(game.player.x, game.player.y + 0.55, 0);
    }
    projectiles.current?.children.forEach((obj, i) => {
      const projectile = game.thrown[i];
      obj.visible = !!projectile;
      if (projectile) {
        obj.position.set(projectile.x, projectile.y, 0.2);
        obj.rotation.z = -clock.elapsedTime * 12;
      }
    });
    if (fx.current) {
      const current = fx.current;
      while (current.children.length < game.particles.length) {
        const sprite = new Sprite(
          new SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
          }),
        );
        current.add(sprite);
      }
      current.children.forEach((obj, i) => {
        const particle = game.particles[i];
        obj.visible = !!particle;
        if (particle) {
          obj.position.set(particle.x, particle.y + particle.age * 1.8, 1);
          obj.scale.setScalar(0.8 * (1 - particle.age / 1.3));
          (obj as Sprite).material.opacity = 1 - particle.age / 1.3;
        }
      });
    }
  });
  return (
    <>
      <ContactShadows game={game} />
      <Pickups game={game} />
      <BonusPickups game={game} />
      <OriginalLevelProps game={game} />
      <group ref={barrels}>
        {level.barrels.map((b, i) => (
          <group key={i} position={[b.x, b.y, 0]}>
            <Barrel kind={b.kind} />
          </group>
        ))}
      </group>
      {game.enemies.map((enemy, i) => (
        <EnemyModel key={i} enemy={enemy} game={game} />
      ))}
      <group ref={carried}>
        <Barrel />
      </group>
      <group ref={projectiles}>
        {Array.from({ length: 8 }, (_, i) => (
          <group key={i} visible={false}>
            <Barrel />
          </group>
        ))}
      </group>
      <group ref={cart}>
        <mesh
          geometry={box}
          scale={[1.9, 0.55, 1.25]}
          position={[0, 0.1, 0]}
          castShadow
        >
          <meshStandardMaterial color="#746c63" metalness={0.5} />
        </mesh>
        {[-1, 1].flatMap((side) =>
          [-1, 1].map((z) => (
            <mesh
              key={`${side}${z}`}
              geometry={cylinder}
              scale={[0.5, 0.18, 0.5]}
              rotation={[Math.PI / 2, 0, 0]}
              position={[side * 0.63, -0.32, z * 0.66]}
            >
              <meshStandardMaterial color="#353e3d" metalness={0.6} />
            </mesh>
          )),
        )}
      </group>
      <group ref={fx} />
      <group position={[game.level.length - 1, 0, 0]}>
        <mesh geometry={box} position={[0, 1.4, 0]} scale={[0.14, 2.8, 0.14]}>
          <meshStandardMaterial color="#856744" />
        </mesh>
        <mesh
          geometry={box}
          position={[0.3, 2.5, 0]}
          scale={[2, 0.8, 0.22]}
          rotation={[0, 0, -0.06]}
        >
          <meshStandardMaterial color="#96734b" roughness={1} />
        </mesh>
        <Label text="SORTIE →" position={[0.3, 2.5, 0.2]} scale={0.5} />
      </group>
    </>
  );
});
