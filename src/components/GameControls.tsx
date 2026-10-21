import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useTranslation } from "react-i18next";
import { tx } from "../i18n/resolveText";
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
  chargeable = false,
  chargeProgress = 0,
  sustained = false,
}: {
  controls: Controls;
  action: Key;
  title: string;
  glyph: string;
  className?: string;
  clickMode?: boolean;
  chargeable?: boolean;
  chargeProgress?: number;
  sustained?: boolean;
}) {
  const { t } = useTranslation();
  const [down, setDown] = useState(false),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const source = `screen-${action}`, toggleable=chargeable || sustained;
  // Sustained screen actions latch in BOTH steering modes: no extra finger
  // is required while jumping, steering or swimming.
  const latched = toggleable;
  const active = controls.sources.get(source) === action;
  useEffect(() => { if (down !== active) setDown(active); }, [active, down]);
  useEffect(()=>{clearTimeout(timer.current);controls.set(source,action,false);setDown(false);},[clickMode,toggleable,controls,source,action]);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      controls.set(source, action, false);
    },
    [controls, source, action],
  );
  const release = () => {
    if (latched) return;
    setDown(false);
    if (!clickMode) controls.set(source, action, false);
  };
  return (
    <button
      className={`game-button ${className} ${active ? "is-down" : ""}`}
      aria-label={title}
      title={title}
      aria-pressed={latched ? active : undefined}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const next = latched ? !active : true;
        setDown(next);
        controls.set(source, action, next);
        feedback();
        if (clickMode && !latched) {
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
          if (latched) {
            const next = !controls.input.held.has(action);
            controls.set(source,action,next);setDown(next);return;
          }
          controls.set(source, action, true);
          timer.current = setTimeout(
            () => controls.set(source, action, false),
            100,
          );
        }
      }}
    >
      {chargeable && <span className="charge-progress" role="progressbar" aria-label={t("chargePower")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(chargeProgress*100)} style={{height:`${chargeProgress*100}%`}}/>}
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
  const { t } = useTranslation();
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
      aria-label={next < 0 ? t("goLeft") : t("goRight")}
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
      aria-label={t("virtualController")}
    >
      <div className="controller-toolbar">
        <span className="controller-label">
          <i />{" "}
          {game.mount?.kind === "rambi" || game.mount?.kind === "enguarde" ? t("tapChargeHint") : game.mount?.kind === "expresso" ? t("tapFlutterHint") : game.player.carry >= 0 ? t("tapCarryHint") : clickMode ? t("clickModeHint") : t("touchModeHint")}
        </span>
        <button
          className="input-mode"
          aria-pressed={clickMode}
          onClick={() => {
            clear();
            setClickMode(!clickMode);
          }}
        >
          {clickMode ? t("clickMode") : t("touchMode")} <span>⇄</span>
        </button>
      </div>
      <div className="controller-layout">
        <div
          className="dpad"
          ref={pad}
          role="group"
          aria-label={t("directionRun")}
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
              aria-label={key === "up" ? t("swimUp") : t("swimDown")}
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
            aria-label={t("stopMove")}
            onPointerDown={(e) => {
              e.stopPropagation();
              clear();
            }}
          >
            ■
          </button>
          <span className="direction-caption">
            {t("directionRun")}
          </span>
        </div>
        <div className="controller-center">
          <span className="controller-emblem">{game.mount ? "🐾" : "GC"}</span>
          <span>
            {game.mount
              ? tx(ANIMAL_DESIGNS[game.mount.kind].name).toUpperCase()
              : (
                  <>
                    {t("adventureDuoLine1")}
                    <br />
                    {t("adventureDuoLine2")}
                  </>
                )}
          </span>
        </div>
        <div className="action-cluster">
          <ActionButton
            controls={controls}
            action="swap"
            title={game.mount ? t("dismount") : t("swapBuddy")}
            glyph="⇄"
            className="swap-button"
            clickMode={clickMode}
          />
          <ActionButton
            controls={controls}
            key={`action-${game.levelId}-${game.sceneRevision}-${game.player.mount}-${game.player.cannon >= 0}`}
            action="action"
            title={game.player.cannon >= 0 ? t("fire") : game.mount?.kind === "enguarde" || game.mount?.kind === "rambi" ? game.player.mountCharge >= .65 ? t("launchCharge") : t("charge") : game.player.carry >= 0 ? t("throw") : t("action")}
            glyph="✦"
            className="action-button"
            chargeable={game.mount?.kind === "rambi" || game.mount?.kind === "enguarde"}
            chargeProgress={Math.min(1,game.player.mountCharge/.65)}
            clickMode={clickMode}
          />
          <ActionButton
            controls={controls}
            key={`jump-${game.levelId}-${game.sceneRevision}-${game.player.mount}-${game.player.cannon >= 0}`}
            action="jump"
            title={game.player.cannon >= 0 ? t("blastOff") : game.mount?.kind === "enguarde" ? t("dart") : game.mount?.kind === "expresso" ? controls.input.held.has("jump") ? t("stopFlutter") : t("flutter") : game.mount?.kind === "winky" ? t("leap") : game.level.biome === "lagoon" ? t("swim") : t("jump")}
            glyph="↑"
            className="jump-button"
            sustained={game.mount?.kind === "expresso"}
            clickMode={clickMode}
          />
        </div>
      </div>
    </section>
  );
}
