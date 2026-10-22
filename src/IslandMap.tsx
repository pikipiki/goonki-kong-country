import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Group, OrthographicCamera, Vector3 } from "three";
import { Goonk } from "./game3d/Goonk";
import { PlushSpriteRenderer } from "./game2d/plushSprite";
import { useTranslation } from "react-i18next";
import { tr } from "./i18n";
import { tx } from "./i18n/resolveText";
import { romMapLayout } from "./mapLayout";

// Seven adapted destinations. Alternate rows leave room for readable labels;
// portrait follows a winding vertical trail instead of shrinking the island.
const wideNodes: [number, number][] = [[-10,3],[-7,-2],[-3.5,3],[0,-2],[3.5,3],[7,-2],[10,3]];
const tallNodes: [number, number][] = [[-4.5,-8],[4.5,-5],[-4.5,-2],[4.5,1],[-4.5,4],[4.5,7],[-4.5,10]];
// Authentic 2D Kongo Jungle ROM Map (256x224) trail coordinates
const romMapNodes: [number, number][] = [
  [54, 76],
  [114, 82],
  [108, 126],
  [60, 148],
  [148, 146],
  [136, 188],
  [216, 182],
];
const colors = ["#547637", "#345d35", "#6b6252", "#39858c", "#d8e3ce", "#87734e", "#947541"];
type Destination = { name: string; subtitle: string };
type MapProps = {
  selected: number;
  unlocked: number;
  initial: number;
  onSelect: (i: number) => void;
  onConfirm: () => void;
  stages: Destination[];
  mode2D?: boolean;
  onSound?: (name: "map-step" | "map-arrive") => void;
};

function Travelers({
  selected,
  initial,
  nodes,
  onSound,
}: {
  selected: number;
  initial: number;
  nodes: [number, number][];
  onSound?: (name: "map-step" | "map-arrive") => void;
}) {
  const root = useRef<Group>(null);
  const at = useRef(initial);
  const destination = useRef(initial);
  const progress = useRef(0);
  const lastHop = useRef(-1);
  const celebrateTimer = useRef(0);
  const [animState, setAnimState] = useState<"idle" | "walk" | "celebrate">("idle");
  const prevAnimState = useRef<"idle" | "walk" | "celebrate">("idle");

  useFrame(({ clock }, delta) => {
    if (!root.current) return;
    const dt = Math.min(delta, 0.1);

    if (destination.current === at.current && at.current !== selected) {
      destination.current = at.current + Math.sign(selected - at.current);
      progress.current = 0;
      lastHop.current = -1;
      celebrateTimer.current = 0;
    }

    if (destination.current !== at.current) {
      progress.current = Math.min(1, progress.current + dt * 1.65);
      const t = progress.current;
      const hopIdx = Math.min(2, Math.floor(t * 3));
      if (hopIdx !== lastHop.current) {
        lastHop.current = hopIdx;
        onSound?.("map-step");
      }
      const a = nodes[at.current] ?? nodes[0];
      const b = nodes[destination.current] ?? nodes[0];
      const ease = t * t * (3 - 2 * t);
      const hopY = Math.abs(Math.sin(t * Math.PI * 3)) * 0.52;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      root.current.position.set(a[0] + dx * ease, 0.3 + hopY, a[1] + dz * ease);
      root.current.rotation.y = Math.atan2(dx, Math.abs(dz) + 1.5) * 0.45;

      if (prevAnimState.current !== "walk") {
        prevAnimState.current = "walk";
        setAnimState("walk");
      }

      if (t >= 1) {
        at.current = destination.current;
        progress.current = 0;
        if (at.current === selected) {
          celebrateTimer.current = 1.25;
          onSound?.("map-arrive");
          prevAnimState.current = "celebrate";
          setAnimState("celebrate");
        }
      }
    } else {
      const a = nodes[at.current] ?? nodes[0];
      if (celebrateTimer.current > 0) {
        celebrateTimer.current = Math.max(0, celebrateTimer.current - dt);
        const hopY = Math.abs(Math.sin(clock.elapsedTime * 10)) * 0.38;
        root.current.position.set(a[0], 0.3 + hopY, a[1]);
        root.current.rotation.y = Math.sin(clock.elapsedTime * 9) * 0.28;
        if (celebrateTimer.current === 0 && prevAnimState.current !== "idle") {
          prevAnimState.current = "idle";
          setAnimState("idle");
        }
      } else {
        root.current.position.set(a[0], 0.3, a[1]);
        root.current.rotation.y = 0;
      }
    }
  });

  const walkSpeed = animState === "walk" ? 5.5 : 0;
  const celebrating = animState === "celebrate";

  return (
    <group ref={root}>
      <group scale={0.58}>
        <Goonk pink preview mapWalk={walkSpeed} mapCelebrate={celebrating} />
      </group>
      <group position={[-0.85, 0, -0.35]} scale={0.51}>
        <Goonk pink={false} preview mapWalk={walkSpeed} mapCelebrate={celebrating} />
      </group>
    </group>
  );
}

function Island({
  selected,
  unlocked,
  onSelect,
  initial,
  onProject,
  onSound,
}: Omit<MapProps, "onConfirm"> & {
  onProject: (points: { x: number; y: number }[]) => void;
}) {
  const { camera, size } = useThree();
  const portrait = size.width < 600 && size.height > size.width * 0.8;
  const nodes = portrait ? tallNodes : wideNodes;
  useLayoutEffect(() => {
    const c = camera as OrthographicCamera;
    c.zoom = portrait
      ? Math.min(size.width / 18, size.height / 23)
      : Math.min(size.width / 27, size.height / 10.5);
    c.lookAt(0, 0, portrait ? 1 : 0);
    c.updateProjectionMatrix();
    c.updateMatrixWorld();
    onProject(
      nodes.map(([x, z]) => {
        const point = new Vector3(x, 0.1, z + 1.35).project(c);
        return {
          x: ((point.x + 1) * size.width) / 2,
          y: ((1 - point.y) * size.height) / 2,
        };
      }),
    );
  }, [camera, size.width, size.height, portrait, nodes, onProject]);
  return (
    <>
      <color attach="background" args={["#153b43"]} />
      <hemisphereLight args={["#eddfbc", "#264c39", 2.2]} />
      <directionalLight position={[-8, 15, 9]} intensity={3} color="#ffdba2" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
        <circleGeometry args={[35, 48]} />
        <meshStandardMaterial color="#24585b" roughness={0.45} />
      </mesh>
      <mesh
        position={[0, -2.3, portrait ? 1 : 0]}
        scale={portrait ? [7, 2.5, 12] : [13, 2.5, 6]}
      >
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color="#56764a" flatShading />
      </mesh>
      {nodes.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, -0.4, 0]} scale={[2.2, 0.7, 1.9]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color={colors[i]} roughness={0.95} />
          </mesh>
          {(i === 2 || i === 4 || i === 5) && (
            <mesh
              position={[0, 0.85, -0.7]}
              scale={[1.1, i === 4 ? 2.2 : 1.5, 1.1]}
            >
              <coneGeometry args={[1, 1.6, 7]} />
              <meshStandardMaterial
                color={i === 4 ? "#e1e5d8" : "#79705a"}
                flatShading
              />
            </mesh>
          )}
          {(i === 0 || i === 1) &&
            [-1, 1].map((side) => (
              <group key={side} position={[side * 0.9, 0, -0.65]}>
                <mesh position={[0, 0.55, 0]}>
                  <cylinderGeometry args={[0.1, 0.18, 1.2, 6]} />
                  <meshStandardMaterial color="#79513a" />
                </mesh>
                <mesh position={[0, 1.35, 0]} scale={[0.9, 0.75, 0.9]}>
                  <icosahedronGeometry args={[1, 1]} />
                  <meshStandardMaterial color="#315b31" flatShading />
                </mesh>
              </group>
            ))}
          <mesh
            position={[0, 0.11, 0.4]}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              if (i <= unlocked) onSelect(i);
            }}
          >
            <ringGeometry args={[0.38, 0.62, 24]} />
            <meshStandardMaterial
              color={
                i > unlocked ? "#4b4d3d" : i === selected ? "#ffce52" : "#e2bc6b"
              }
              emissive={i === selected ? "#8c5c0e" : "#000000"}
            />
          </mesh>
        </group>
      ))}
      {nodes.slice(1).flatMap((b, i) =>
        Array.from({ length: 10 }, (_, n) => {
          const a = nodes[i],
            t = (n + 0.5) / 10;
          return (
            <mesh
              key={`${i}-${n}`}
              position={[
                a[0] + (b[0] - a[0]) * t,
                0.18,
                a[1] + (b[1] - a[1]) * t,
              ]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <circleGeometry args={[0.085, 8]} />
              <meshBasicMaterial color={i < unlocked ? "#e2c07b" : "#5f6d57"} />
            </mesh>
          );
        }),
      )}
      <Travelers
        selected={selected}
        initial={initial}
        nodes={nodes}
        onSound={onSound}
      />
    </>
  );
}

function RomMap2D({
  selected,
  unlocked,
  initial,
  onSelect,
  onProject,
  onSound,
}: Omit<MapProps, "onConfirm"> & {
  onProject: (points: { x: number; y: number }[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedRef = useRef(selected);
  const unlockedRef = useRef(unlocked);
  const onSelectRef = useRef(onSelect);
  const onProjectRef = useRef(onProject);
  const onSoundRef = useRef(onSound);

  selectedRef.current = selected;
  unlockedRef.current = unlocked;
  onSelectRef.current = onSelect;
  onProjectRef.current = onProject;
  onSoundRef.current = onSound;

  useEffect(() => {
    let active = true;
    let raf = 0;
    const plushRenderer = new PlushSpriteRenderer();
    let mapImg: HTMLImageElement | null = null;

    const base =
      typeof import.meta !== "undefined" && import.meta.env?.BASE_URL
        ? import.meta.env.BASE_URL
        : "/";
    const img = new Image();
    img.onload = () => {
      if (active) mapImg = img;
    };
    img.src = `${base.replace(/\/?$/, "/")}rom2d/map-kongo.png`;

    let at = initial;
    let destination = initial;
    let progress = 0;
    let lastHop = -1;
    let celebrateTimer = 0;
    let lastTime = performance.now();
    let elapsed = 0;
    let lastW = 0;
    let lastH = 0;

    const step = (now: number) => {
      if (!active) return;
      raf = requestAnimationFrame(step);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      elapsed += dt;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cw = Math.max(256, Math.round(rect.width || window.innerWidth));
      const ch = Math.max(224, Math.round(rect.height || window.innerHeight));

      const layout = romMapLayout(cw, ch, !!canvas.closest(".phase-map"));
      const { scale: mapScale, offsetX, offsetY } = layout;
      const drawW = 256 * mapScale;
      const drawH = 224 * mapScale;

      if (cw !== lastW || ch !== lastH) {
        lastW = cw;
        lastH = ch;
        canvas.width = cw;
        canvas.height = ch;
        onProjectRef.current(layout.labels);
      }

      const target = selectedRef.current;
      if (destination === at && at !== target) {
        destination = at + Math.sign(target - at);
        progress = 0;
        lastHop = -1;
        celebrateTimer = 0;
      }

      let px = romMapNodes[at]?.[0] ?? 54;
      let py = romMapNodes[at]?.[1] ?? 76;
      let facing = 1;
      let walking = 0;
      let hopY = 0;
      let celebrating = false;

      if (destination !== at) {
        progress = Math.min(1, progress + dt * 1.65);
        const hopIdx = Math.min(2, Math.floor(progress * 3));
        if (hopIdx !== lastHop) {
          lastHop = hopIdx;
          onSoundRef.current?.("map-step");
        }
        const a = romMapNodes[at] ?? romMapNodes[0];
        const b = romMapNodes[destination] ?? romMapNodes[0];
        const ease = progress * progress * (3 - 2 * progress);
        px = a[0] + (b[0] - a[0]) * ease;
        py = a[1] + (b[1] - a[1]) * ease;
        facing = b[0] >= a[0] ? 1 : -1;
        walking = 6;
        hopY = Math.abs(Math.sin(progress * Math.PI * 3)) * 8;
        if (progress >= 1) {
          at = destination;
          progress = 0;
          if (at === target) {
            celebrateTimer = 1.25;
            onSoundRef.current?.("map-arrive");
          }
        }
      } else if (celebrateTimer > 0) {
        celebrateTimer = Math.max(0, celebrateTimer - dt);
        celebrating = true;
        hopY = Math.abs(Math.sin(elapsed * 10)) * 6;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;

      // Backdrop
      ctx.fillStyle = "#0c3943";
      ctx.fillRect(0, 0, cw, ch);
      // Ocean continues to the viewport edges; the complete ROM island stays
      // visible rather than being cropped by the phone's aspect ratio.
      for (let y = 0; y < ch; y += 28) {
        ctx.fillStyle = y % 56 ? "#164851" : "#12434d";
        ctx.fillRect(0, y, cw, 2);
      }

      if (mapImg) {
        ctx.drawImage(mapImg, 0, 0, 256, 224, offsetX, offsetY, drawW, drawH);
      }

      // Named touch targets sit beside crowded ROM markers. Fine leaders
      // preserve the link to each real destination without overlapping labels.
      ctx.strokeStyle = "#f7d78d99";
      ctx.lineWidth = 1;
      romMapNodes.forEach(([x, y], i) => {
        ctx.beginPath();
        ctx.moveTo(offsetX + x * mapScale, offsetY + y * mapScale);
        ctx.lineTo(layout.labels[i].x, layout.labels[i].y);
        ctx.stroke();
      });

      // Draw ROM map trail dots
      for (let i = 0; i < romMapNodes.length - 1; i++) {
        const a = romMapNodes[i];
        const b = romMapNodes[i + 1];
        const isPathUnlocked = i < unlockedRef.current;
        for (let d = 1; d <= 6; d++) {
          const t = d / 7;
          const dx = offsetX + (a[0] + (b[0] - a[0]) * t) * mapScale;
          const dy = offsetY + (a[1] + (b[1] - a[1]) * t) * mapScale;
          ctx.fillStyle = "#120c04";
          ctx.beginPath();
          ctx.arc(dx, dy, Math.max(2, 2.6 * mapScale), 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = isPathUnlocked ? "#ffda66" : "#6c7364";
          ctx.beginPath();
          ctx.arc(dx, dy, Math.max(1.2, 1.8 * mapScale), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw ROM stage node markers
      romMapNodes.forEach(([nx, ny], i) => {
        const sx = offsetX + nx * mapScale;
        const sy = offsetY + ny * mapScale;
        const isSelected = i === selectedRef.current;
        const isUnlocked = i <= unlockedRef.current;
        const pulse = isSelected ? 1 + Math.sin(elapsed * 6) * 0.16 : 1;
        const r = Math.max(4, 5.5 * mapScale * pulse);

        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.beginPath();
        ctx.ellipse(sx, sy + 1.5 * mapScale, r * 1.15, r * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = !isUnlocked
          ? "#55584c"
          : isSelected
            ? "#ffdf5a"
            : "#d94f38";
        ctx.strokeStyle = isSelected ? "#fff8d6" : "#241608";
        ctx.lineWidth = Math.max(1.5, 1.4 * mapScale);
        ctx.beginPath();
        ctx.ellipse(sx, sy, r, r * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Draw Modeled 2D Plushies (Violette companion + Rose leader) on the 2D ROM Map
      const plushScale = Math.max(0.5, mapScale * 0.52);
      const compScreenX = offsetX + (px - facing * 11) * mapScale;
      const compScreenY = offsetY + (py - 2 - hopY * 0.85) * mapScale;
      plushRenderer.draw(
        ctx,
        compScreenX,
        compScreenY,
        {
          pink: false,
          facing,
          walking,
          grounded: hopY < 1,
          roll: false,
          rollAngle: 0,
          rollFacing: 1,
          cannonFlight: false,
          swapping: false,
          swapHop: hopY > 2 ? 0.5 : 0,
          companion: true,
          riding: false,
          carrying: false,
          celebrating,
          time: elapsed,
        },
        plushScale * 0.92,
      );

      const leadScreenX = offsetX + px * mapScale;
      const leadScreenY = offsetY + (py - hopY) * mapScale;
      plushRenderer.draw(
        ctx,
        leadScreenX,
        leadScreenY,
        {
          pink: true,
          facing,
          walking,
          grounded: hopY < 1,
          roll: false,
          rollAngle: 0,
          rollFacing: 1,
          cannonFlight: false,
          swapping: false,
          swapHop: hopY > 2 ? 0.5 : 0,
          companion: false,
          riding: false,
          carrying: false,
          celebrating,
          time: elapsed,
        },
        plushScale,
      );
    };

    raf = requestAnimationFrame(step);
    return () => {
      active = false;
      cancelAnimationFrame(raf);
      plushRenderer.dispose();
    };
  }, [initial]);

  return (
    <canvas
      ref={canvasRef}
      className="island-map-2d-canvas"
      onClick={(e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { scale: mapScale, offsetX, offsetY } = romMapLayout(rect.width, rect.height, !!canvas.closest(".phase-map"));
        for (let i = 0; i < romMapNodes.length; i++) {
          if (i > unlocked) continue;
          const nx = offsetX + romMapNodes[i][0] * mapScale;
          const ny = offsetY + romMapNodes[i][1] * mapScale;
          if (Math.hypot(x - nx, y - ny) < Math.max(22, 12 * mapScale)) {
            onSelect(i);
            break;
          }
        }
      }}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        imageRendering: "pixelated",
      }}
    />
  );
}

export function IslandMap(props: MapProps) {
  useTranslation();
  const root = useRef<HTMLDivElement>(null),
    [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
  const onProject = useCallback(
    (points: { x: number; y: number }[]) => setPositions(points),
    [],
  );
  useEffect(() => {
    root.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div
      ref={root}
      className={`island-map ${props.mode2D ? "island-map-2d" : "island-map-3d"}`}
      role="group"
      tabIndex={0}
      aria-label={tr("islandMapAria")}
      aria-describedby="map-instructions"
      onKeyDown={(event) => {
        const direction =
          event.key === "ArrowRight" || event.key === "ArrowDown"
            ? 1
            : event.key === "ArrowLeft" || event.key === "ArrowUp"
              ? -1
              : 0;
        if (direction) {
          event.preventDefault();
          props.onSelect(
            (props.selected + direction + props.stages.length) %
              props.stages.length,
          );
        } else if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          props.onSelect(event.key === "Home" ? 0 : props.stages.length - 1);
        } else if (event.key === "Enter") {
          event.preventDefault();
          props.onConfirm();
        }
      }}
    >
      {props.mode2D ? (
        <RomMap2D {...props} onProject={onProject} />
      ) : (
        <Canvas
          orthographic
          dpr={[1, 1.25]}
          camera={{ position: [0, 26, 13], zoom: 21, near: 0.1, far: 100 }}
          onCreated={({ camera }) => {
            camera.lookAt(0, 0, 0);
            camera.updateProjectionMatrix();
          }}
        >
          <Island {...props} onProject={onProject} />
        </Canvas>
      )}
      <div className="map-labels">
        {positions.map((position, i) => (
          <div
            className="map-label-anchor"
            key={i}
            style={{ left: position.x, top: position.y }}
          >
            <button
              type="button"
              className={`map-stage${i === props.selected ? " selected" : ""}`}
              aria-label={`${i + 1}. ${tx(props.stages[i].name)}`}
              aria-pressed={i === props.selected}
              disabled={i > props.unlocked}
              onClick={() => props.onSelect(i)}
            >
              <span className="map-stage-number" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="map-stage-name">{tx(props.stages[i].name)}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
