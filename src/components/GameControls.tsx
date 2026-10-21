import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ANIMAL_DESIGNS } from "../game/animals";
import type { Game, Key } from "../game/engine";
import type { Controls } from "../game/input";

function feedback() {
  if (navigator.vibrate) navigator.vibrate(9);
}
function ActionButton({
  controls,
  action,
  title,
  glyph,
  className = "",
  clickMode = false,
}: {
  controls: Controls;
  action: Key;
  title: string;
  glyph: string;
  className?: string;
  clickMode?: boolean;
}) {
  const [down, setDown] = useState(false),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const source = `screen-${action}`;
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      controls.set(source, action, false);
    },
    [controls, source, action],
  );
  const release = () => {
    setDown(false);
    if (!clickMode) controls.set(source, action, false);
  };
  return (
    <button
      className={`game-button ${className} ${down ? "is-down" : ""}`}
      aria-label={title}
      title={title}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDown(true);
        controls.set(source, action, true);
        feedback();
        if (clickMode) {
          clearTimeout(timer.current);
          timer.current = setTimeout(
            () => controls.set(source, action, false),
            action === "jump" ? 350 : 90,
          );
        }
      }}
      onPointerUp={release}
      onPointerCancel={() => {
        clearTimeout(timer.current);
        controls.set(source, action, false);
        setDown(false);
      }}
      onLostPointerCapture={release}
      onClick={(e) => {
        if (e.detail === 0) {
          controls.set(source, action, true);
          timer.current = setTimeout(
            () => controls.set(source, action, false),
            100,
          );
        }
      }}
    >
      <span className="button-glyph" aria-hidden="true">
        {glyph}
      </span>
      <span className="button-caption">{title}</span>
    </button>
  );
}
export function GameControls({
  controls,
  game,
}: {
  controls: Controls;
  game: Game;
}) {
  const [clickMode, setClickMode] = useState(() => {
      try {
        return localStorage.getItem("goonk-input-mode") === "click";
      } catch {
        return false;
      }
    }),
    [direction, setDirection] = useState(0),
    [stick, setStick] = useState({ x: 0, y: 0 }),
    pad = useRef<HTMLDivElement>(null),
    pointer = useRef<number | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem("goonk-input-mode", clickMode ? "click" : "touch");
    } catch {}
    controls.setClickMode(clickMode);
  }, [clickMode, controls]);
  const clear = () => {
    for (const key of ["left", "right", "run", "up", "down"] as Key[])
      controls.set(`virtual-${key}`, key, false);
    setDirection(0);
    setStick({ x: 0, y: 0 });
  };
  useEffect(() => {
    const reset = () => {
      pointer.current = null;
      clear();
    };
    window.addEventListener("resize", reset);
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("resize", reset);
      window.removeEventListener("blur", reset);
      clear();
    };
  }, [controls]);
  const steer = (next: number, running = true) => {
    setDirection(next);
    controls.set("virtual-left", "left", next < 0);
    controls.set("virtual-right", "right", next > 0);
    controls.set("virtual-run", "run", next !== 0 && running);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== e.pointerId || clickMode || !pad.current) return;
    const rect = pad.current.getBoundingClientRect(),
      x = e.clientX - rect.left - rect.width / 2,
      y = e.clientY - rect.top - rect.height / 2;
    const distance = Math.hypot(x, y),
      factor = Math.min(1, 38 / Math.max(1, distance));
    setStick({ x: x * factor, y: y * factor });
    steer(Math.abs(x) > 13 ? Math.sign(x) : 0, Math.abs(x) > 32);
    controls.set("virtual-up", "up", game.level.biome === "lagoon" && y < -22);
    controls.set(
      "virtual-down",
      "down",
      game.level.biome === "lagoon" && y > 22,
    );
  };
  const directionButton = (next: number) => (
    <button
      className={`direction-button ${next < 0 ? "left" : "right"} ${direction === next ? "is-down" : ""}`}
      aria-label={next < 0 ? "Aller à gauche" : "Aller à droite"}
      aria-pressed={direction === next}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        steer(clickMode && direction === next ? 0 : next);
        feedback();
      }}
      onPointerUp={() => {
        if (!clickMode) clear();
      }}
      onPointerCancel={clear}
      onLostPointerCapture={() => {
        if (!clickMode) clear();
      }}
      onClick={(e) => {
        if (e.detail === 0) steer(direction === next ? 0 : next);
      }}
    >
      <span aria-hidden="true">{next < 0 ? "◀" : "▶"}</span>
    </button>
  );
  return (
    <section
      className={`controller-deck ${clickMode ? "click-mode" : ""}`}
      aria-label="Manette virtuelle"
    >
      <div className="controller-toolbar">
        <span className="controller-label">
          <i />{" "}
          {clickMode
            ? "CLIC POUR AVANCER · RECLIC POUR STOPPER"
            : "GLISSER POUR DIRIGER · MAINTENIR POUR SAUTER"}
        </span>
        <button
          className="input-mode"
          aria-pressed={clickMode}
          onClick={() => {
            clear();
            setClickMode(!clickMode);
          }}
        >
          {clickMode ? "Mode clic" : "Mode tactile"} <span>⇄</span>
        </button>
      </div>
      <div className="controller-layout">
        <div
          className="dpad"
          ref={pad}
          role="group"
          aria-label="Direction et course"
          onPointerDown={(e) => {
            if (clickMode) return;
            e.preventDefault();
            pointer.current = e.pointerId;
            e.currentTarget.setPointerCapture(e.pointerId);
            move(e);
          }}
          onPointerMove={move}
          onPointerUp={() => {
            pointer.current = null;
            if (!clickMode) clear();
          }}
          onPointerCancel={() => {
            pointer.current = null;
            clear();
          }}
          onLostPointerCapture={() => {
            pointer.current = null;
            if (!clickMode) clear();
          }}
        >
          <span className="dpad-ring" />
          <span
            className="stick"
            style={{ transform: `translate(${stick.x}px,${stick.y}px)` }}
            aria-hidden="true"
          />
          {game.level.biome === "lagoon" && (["up", "down"] as const).map((key) => (
            <button key={key} className={`swim-direction swim-${key}`}
              aria-label={key === "up" ? "Nager vers le haut" : "Nager vers le bas"}
              onPointerDown={(e) => {
                e.stopPropagation(); e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                const active = controls.input.held.has(key);
                controls.set(`virtual-${key === "up" ? "down" : "up"}`, key === "up" ? "down" : "up", false);
                controls.set(`virtual-${key}`, key, clickMode ? !active : true);
              }}
              onPointerUp={() => { if (!clickMode) controls.set(`virtual-${key}`, key, false); }}
              onLostPointerCapture={() => { if (!clickMode) controls.set(`virtual-${key}`, key, false); }}
              onPointerCancel={() => controls.set(`virtual-${key}`, key, false)}
              onClick={(e) => { if (e.detail === 0) controls.set(`virtual-${key}`, key, !controls.input.held.has(key)); }}
            >{key === "up" ? "▲" : "▼"}</button>
          ))}
          {directionButton(-1)}
          {directionButton(1)}
          <button
            className="stop-button"
            aria-label="Arrêter le déplacement"
            onPointerDown={(e) => {
              e.stopPropagation();
              clear();
            }}
          >
            ■
          </button>
          <span className="direction-caption">
            DIRECTION <b>•</b> COURSE
          </span>
        </div>
        <div className="controller-center">
          <span className="controller-emblem">{game.mount ? "🐾" : "GC"}</span>
          <span>{game.mount ? ANIMAL_DESIGNS[game.mount.kind].name.toUpperCase() : <>AVENTURE<br />À DEUX</>}</span>
        </div>
        <div className="action-cluster">
          <ActionButton
            controls={controls}
            action="swap"
            title={game.mount ? "Descendre" : "Changer"}
            glyph="⇄"
            className="swap-button"
            clickMode={clickMode}
          />
          <ActionButton
            controls={controls}
            action="action"
            title={game.player.cannon >= 0 ? "Tirer" : game.mount?.kind === "enguarde" ? "Rostre" : game.mount?.kind === "rambi" ? "Corne" : game.player.carry >= 0 ? "Lancer" : "Action"}
            glyph="✦"
            className="action-button"
            clickMode={clickMode}
          />
          <ActionButton
            controls={controls}
            action="jump"
            title={game.player.cannon >= 0 ? "Décoller" : game.mount?.kind === "enguarde" ? "Foncer" : game.mount?.kind === "expresso" ? "Planer" : game.mount?.kind === "winky" ? "Bondir" : game.level.biome === "lagoon" ? "Nager" : "Sauter"}
            glyph="↑"
            className="jump-button"
            clickMode={clickMode}
          />
        </div>
      </div>
    </section>
  );
}
