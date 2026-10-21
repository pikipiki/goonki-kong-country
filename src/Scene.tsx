import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Group, OrthographicCamera } from "three";
import { Goonk } from "./game3d/Goonk";
import { Animals } from "./game3d/Animals";
import { Actors } from "./game3d/Actors";
import { World } from "./game3d/World";
import { cameraLayout } from "./game/camera";
import { STEP, type Game, type Input } from "./game/engine";

function Director({
  game,
  input,
  onTick,
}: {
  game: Game;
  input: Input;
  onTick: () => void;
}) {
  const accumulator = useRef(0),
    nextUI = useRef(0),
    lastLevel = useRef(game.levelId),
    focus = useRef(6),
    { size } = useThree();
  useFrame(({ camera }, delta) => {
    accumulator.current += Math.min(delta, 0.1);
    while (accumulator.current >= STEP) {
      game.update(input);
      accumulator.current -= STEP;
    }
    const title = game.phase === "title",
      layout = cameraLayout(size.width, size.height, title),
      desired = title
        ? layout.portrait
          ? 10.5
          : 8
        : game.player.x + layout.ahead;
    if (
      lastLevel.current !== game.levelId ||
      Math.abs(focus.current - desired) > 18
    ) {
      focus.current = desired;
      lastLevel.current = game.levelId;
    }
    focus.current += (desired - focus.current) * (1 - Math.exp(-delta * 5));
    const cam = camera as OrthographicCamera;
    cam.zoom = layout.zoom;
    const depthFollow =
      Boolean(game.level.originalTerrain);
    const followY =
      depthFollow && Math.abs(game.player.y) > 1.2
        ? game.player.y - Math.sign(game.player.y) * 1.5
        : 0;
    const lookY=layout.lookY+followY;
    const cameraY = lookY + 2.25;
    game.cameraBounds = { x:focus.current, y:lookY,
      halfX:layout.worldWidth/2, halfY:layout.worldHeight/2+0.5 };
    cam.position.set(focus.current, cameraY, 22);
    cam.lookAt(focus.current, lookY, 0);
    cam.updateProjectionMatrix();
    nextUI.current += delta;
    if (nextUI.current > 0.09) {
      nextUI.current = 0;
      onTick();
    }
  });
  return null;
}
function Cast({ game }: { game: Game }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    if (group.current) group.current.visible = game.phase !== "title";
  });
  return (
    <group ref={group}>
      <Goonk pink={game.player.active === 0} game={game} />
      <Goonk pink={game.player.active !== 0} game={game} companion />
    </group>
  );
}
function TitleCast({ game }: { game: Game }) {
  const root = useRef<Group>(null),
    { size } = useThree();
  useFrame(() => {
    if (!root.current) return;
    root.current.visible = game.phase === "title";
    const portrait = size.width / size.height < 0.9;
    root.current.children[0].position.x = portrait ? 9.15 : 11;
    root.current.children[1].position.x = portrait ? 11.85 : 14.5;
    root.current.children[0].scale.setScalar(portrait ? 1.6 : 1.85);
    root.current.children[1].scale.setScalar(portrait ? 1.48 : 1.65);
  });
  return (
    <group ref={root}>
      <group position={[11, 0.05, 1]} scale={1.85}>
        <Goonk pink preview />
      </group>
      <group position={[14.5, 0.05, 0]} scale={1.65}>
        <Goonk pink={false} preview />
      </group>
    </group>
  );
}
function ContextNotice() {
  const { gl } = useThree();
  const [lost, setLost] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setLost(true);
    };
    gl.domElement.addEventListener("webglcontextlost", handler);
    return () => gl.domElement.removeEventListener("webglcontextlost", handler);
  }, [gl]);
  useEffect(() => {
    if (lost) window.dispatchEvent(new Event("goonk-context-lost"));
  }, [lost]);
  return null;
}
function RenderBudget({ game }: { game: Game }) {
  const { gl, setDpr } = useThree(),
    samples = useRef({ count: 0, seconds: 0, window: 0 });
  useFrame((_, delta) => {
    const s = samples.current;
    s.count++;
    s.seconds += Math.min(delta, 0.2);
    s.window += delta;
    if (s.window > 2.5) {
      const fps = s.count / s.seconds;
      if (fps < 43 && gl.getPixelRatio() > 1) setDpr(1);
      Object.defineProperty(window, "goonkDiagnostics", {
        configurable: true,
        value: {
          stageId: game.levelId,
          sceneRevision: game.sceneRevision,
          fps: Math.round(fps),
          drawCalls: gl.info.render.calls,
          triangles: gl.info.render.triangles,
          dpr: gl.getPixelRatio(),
        },
      });
      s.count = 0;
      s.seconds = 0;
      s.window = 0;
    }
  });
  return null;
}
export function Scene({
  game,
  input,
  onTick,
}: {
  game: Game;
  input: Input;
  onTick: () => void;
}) {
  return (
    <Canvas
      onCreated={({ scene }) => Object.defineProperty(window, "goonkScene", { configurable: true, value: scene })}
      orthographic
      frameloop={
        game.phase === "playing" || game.phase === "title" ? "always" : "demand"
      }
      camera={{ position: [8, 5, 22], zoom: 60, near: 0.1, far: 100 }}
      dpr={[1, 1.35]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      fallback={
        <div className="webgl-fallback">
          Ce navigateur ne permet pas l’affichage 3D. Active WebGL puis recharge
          la page.
        </div>
      }
    >
      <Director game={game} input={input} onTick={onTick} />
      <ContextNotice />
      <RenderBudget game={game} />
      <World key={`world-${game.sceneRevision}`} game={game} level={game.level} />
      {game.phase !== "title" && (
        <group key={`actors-${game.sceneRevision}`}>
          <Actors game={game} />
          <Animals game={game} />
        </group>
      )}
      <Cast game={game} />
      <TitleCast game={game} />
    </Canvas>
  );
}
