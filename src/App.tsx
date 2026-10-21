import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { Game, readSave, type Key, type Phase } from "./game/engine";
import { ANIMAL_DESIGNS } from "./game/animals";
import { ROM_JUNGLE } from "./game/originalJungle";
import { ROM_CORAL } from "./game/originalCoral";
import { ROM_REVERB } from "./game/originalReverb";
import { ROM_MINE_CART } from "./game/originalMineCart";
import { LEVELS } from "./game/levels";
import { Controls, KEYBOARD } from "./game/input";
import { AudioSystem } from "./game/audio";
import { IslandMap } from "./IslandMap";
import { Scene } from "./Scene";
import { Scene2D } from "./game2d/Scene2D";
import { GameControls } from "./components/GameControls";
import i18n from "./i18n";
import { L } from "./i18n/keys";
import { tx } from "./i18n/resolveText";
import { LanguageSelect } from "./components/LanguageSelect";

const STORAGE = "goonk-country-v1";
const MAP_LEVELS = [ROM_JUNGLE, ROM_REVERB, ROM_MINE_CART, ROM_CORAL, ...LEVELS.slice(4)];
function Icon({
  name,
}: {
  name: "sound" | "mute" | "expand" | "pause" | "arrow" | "back" | "map";
}) {
  const paths = {
    sound: "M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
    mute: "M11 5 6 9H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6",
    expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
    pause: "M9 5v14m6-14v14",
    arrow: "M4 12h15m-6-6 6 6-6 6",
    back: "M19 12H4m6-6-6 6 6 6",
    map: "m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2V5Zm6-2v15m6-12v15",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
function Portrait({
  pink = true,
  small = false,
}: {
  pink?: boolean;
  small?: boolean;
}) {
  return (
    <span
      className={`portrait ${pink ? "pink" : "violet"} ${small ? "small" : ""}`}
      aria-hidden="true"
    >
      <i />
      <i />
      <b />
    </span>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError(error: unknown) {
    console.error("[SceneBoundary]", error);
    return { failed: true };
  }
  componentDidCatch(error: unknown, info: { componentStack: string }) {
    console.error("[SceneBoundary] render failed", error, info.componentStack);
  }
  render() {
    return this.state.failed ? (
      <div className="webgl-fallback">
        <h2>{i18n.t("scene3dFailedTitle")}</h2>
        <p>{i18n.t("scene3dFailedBody")}</p>
        <button className="primary" onClick={() => location.reload()}>
          {i18n.t("reload")}
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function App() {
  const { t } = useTranslation();
  const [game] = useState(() => {
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE);
    } catch {}
    return new Game(readSave(saved));
  });
  useEffect(() => {
    // Fast Refresh retains this stateful instance. Refresh its methods as well,
    // otherwise new terrain meshes can coexist with old collision closures.
    if (Object.getPrototypeOf(game) !== Game.prototype)
      Object.setPrototypeOf(game, Game.prototype);
  }, [game, Game]);
  const [mapLevel, setMapLevel] = useState(0);
  const [demo2D, setDemo2D] = useState(false);
  const [controls] = useState(() => new Controls()),
    [audio] = useState(() => new AudioSystem());
  const [, render] = useState(0),
    [muted, setMuted] = useState(false),
    [help, setHelp] = useState(false),
    [contextLost, setContextLost] = useState(false),
    [showControls, setShowControls] = useState(
      () =>
        window.matchMedia("(pointer: coarse)").matches ||
        window.innerWidth < 900,
    );
  const mapBack = useRef<Phase>("title"),
    root = useRef<HTMLDivElement>(null);
  const tick = useCallback(() => render((n) => n + 1), []);
  const change = useCallback(
    (action: () => void) => {
      controls.reset();
      action();
      tick();
    },
    [controls, tick],
  );
  const start = useCallback(
    (id = 0) => {
      audio.boot();
      setDemo2D(false);
      change(() => game.start(id, id === 0 || id === 1 || id === 2 || id === 3));
    },
    [audio, change, game],
  );
  const startDemo2D = useCallback(() => {
    audio.boot();
    setDemo2D(true);
    change(() => game.start(0, true));
  }, [audio, change, game]);
  const openMap = () =>
    change(() => {
      setMapLevel(game.levelId);
      mapBack.current = game.phase === "title" ? "title" : "paused";
      game.phase = "map";
    });
  const phase = game.phase;
  useEffect(() => {
    game.onEvent = (name) =>
      audio.effect(name, {
        character: game.player.active,
        animal: game.mount?.kind,
        letterIndex: game.letters.size - 1,
        inWater: game.level.biome === "lagoon",
      });
    audio.onError = message => game.message(message);
    game.onSave = (save) => {
      try {
        localStorage.setItem(STORAGE, JSON.stringify(save));
      } catch {
        game.message(t("saveUnavailable"));
      }
    };
  }, [game, audio, t]);
  useEffect(() => {
    if (phase === "playing") {
      const scene =
        game.level.originalTerrain === "cave" ? "cave" : game.level.biome;
      audio.play(scene);
    }
    else if (["title","map","clear","victory","gameover"].includes(phase)) audio.play(phase);
    else audio.stop();
    return () => audio.stop();
  }, [phase, audio, game.levelId]);
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "KeyP") {
        e.preventDefault();
        change(() => game.pause());
        return;
      }
      if (e.code === "Enter" && game.phase === "title") {
        if (e.target instanceof HTMLElement && e.target.closest("button")) return;
        e.preventDefault();
        change(()=>{game.phase="map";setMapLevel(game.levelId);});
        return;
      }
      if (game.phase !== "playing") return;
      const key = KEYBOARD[e.code];
      if (key) {
        e.preventDefault();
        controls.set(`keyboard-${e.code}`, key, true);
      }
    };
    const keyup = (e: KeyboardEvent) => {
      const key = KEYBOARD[e.code];
      if (key) controls.set(`keyboard-${e.code}`, key, false);
    };
    const blur = () => {
      controls.reset();
      if (game.phase === "playing") {
        game.pause();
        tick();
      }
    };
    const lost = () => {
      setContextLost(true);
      blur();
    };
    const resized = () => {
      controls.reset();
      if (window.matchMedia("(pointer: coarse)").matches || innerWidth < 900)
        setShowControls(true);
    };
    window.addEventListener("resize", resized);
    const visibility = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    window.addEventListener("goonk-context-lost", lost);
    document.addEventListener("visibilitychange", visibility);
    let frame = 0;
    const poll = () => {
      if (game.phase === "playing") controls.gamepad();
      frame = requestAnimationFrame(poll);
    };
    frame = requestAnimationFrame(poll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resized);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      window.removeEventListener("goonk-context-lost", lost);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [game, controls, change, start, tick]);
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");
    if (!coarse.matches) return;
    const stopGesture = (event: Event) => event.preventDefault();
    document.addEventListener("gesturestart", stopGesture, { passive: false });
    document.addEventListener("gesturechange", stopGesture, { passive: false });
    document.addEventListener("gestureend", stopGesture, { passive: false });
    let lastTouchEnd = 0;
    const onTouchEnd = (event: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd < 320) event.preventDefault();
      lastTouchEnd = now;
    };
    document.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", stopGesture);
      document.removeEventListener("gesturechange", stopGesture);
      document.removeEventListener("gestureend", stopGesture);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode2d =
      params.get("demo") === "2d" ||
      params.get("mode") === "2d" ||
      params.get("play") === "2d";
    if (mode2d) {
      audio.boot();
      setDemo2D(true);
      change(() => {
        game.start(0, true);
        const xParam = params.get("x");
        const yParam = params.get("y");
        if (xParam !== null && xParam !== "") game.player.x = Number(xParam);
        if (yParam !== null && yParam !== "") game.player.y = Number(yParam);
      });
      return;
    }
    const play = params.get("play") ?? params.get("level");
    const coral =
      play === "coral" || play === "lagoon" || play === "3";
    const jungle = play === "jungle" || play === "0";
    const reverb = play === "reverb" || play === "canyon" || play === "cave" || play === "1";
    const minecart =
      play === "minecart" || play === "mine-cart" || play === "cart" || play === "2";
    if (!coral && !jungle && !reverb && !minecart) return;
    audio.boot();
    change(() => {
      if (reverb) {
        game.start(1, true);
        return;
      }
      if (minecart) {
        game.start(2, true);
        return;
      }
      if (jungle) {
        game.start(0, true);
        return;
      }
      game.start(3, true);
      const depth = params.get("depth") ?? "mid";
      if (depth === "start") {
        return;
      }
      game.player.x = Number(params.get("x") ?? 20);
      const yParam = params.get("y");
      if (yParam !== null && yParam !== "") game.player.y = Number(yParam);
      else if (depth === "deep") game.player.y = 1.1;
      else if (depth === "shallow") game.player.y = 4.8;
      else game.player.y = 3.2;
      game.player.vx = 0;
      game.player.vy = 0;
      game.player.grounded = false;
      game.checkpoint = { x: game.player.x, y: game.player.y };
    });
  }, [audio, change, game]);

  // A small inspection surface supports reproducible browser smoke checks.
  useEffect(() => {
    Object.defineProperty(window, "goonk", { value: game, configurable: true });
    Object.defineProperty(window, "goonkAudio", { value: audio, configurable: true });
    return () => {
      Reflect.deleteProperty(window, "goonk");
      Reflect.deleteProperty(window, "goonkAudio");
    };
  }, [game]);
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else
      void root.current
        ?.requestFullscreen()
        .catch(() =>
          game.message(t("fullscreenHint")),
        );
  };
  return (
    <div
      ref={root}
      className={`app phase-${phase} ${showControls ? "has-controls" : ""} ${demo2D ? "demo-2d" : ""}`}
    >
      <div
        className="scene"
        aria-label={demo2D && phase !== "title" && phase !== "map" ? "2D game scene" : "3D game scene"}
      >
        <SceneBoundary>
          {demo2D && phase !== "title" && phase !== "map" ? (
            <Scene2D game={game} input={controls.input} onTick={tick} />
          ) : (
            <Scene game={game} input={controls.input} onTick={tick} />
          )}
        </SceneBoundary>
      </div>
      <div className="vignette" />
      <div className="film-grain" />
      <header className="topbar">
        <button
          className="brand"
          onClick={() =>
            change(() => {
              setDemo2D(false);
              game.load(0, "title");
            })
          }
          aria-label={t("brandHome")}
        >
          <span className="brand-mark">g.</span>
          <span>
            GOONK<span className="brand-sub">COUNTRY</span>
          </span>
        </button>
        {phase === "playing" && (
          <div className="stage-name">
            <span>{String(game.levelId + 1).padStart(2, "0")} / 07</span>
            {tx(game.level.name)}
          </div>
        )}
        <nav className="top-actions" aria-label={t("gameOptions")}>
          <LanguageSelect />
          {phase === "playing" && (
            <button
              className="icon-button control-toggle"
              aria-label={
                showControls ? t("hideVirtualPad") : t("showVirtualPad")
              }
              title={t("virtualPad")}
              aria-pressed={showControls}
              onClick={() => {
                controls.reset();
                setShowControls(!showControls);
              }}
            >
              ✥
            </button>
          )}
          <button
            className="icon-button"
            aria-label={muted ? t("soundOn") : t("soundOff")}
            title={muted ? t("soundOn") : t("soundOff")}
            onClick={() => {
              audio.boot();
              audio.toggle();
              setMuted(audio.muted);
            }}
          >
            <Icon name={muted ? "mute" : "sound"} />
          </button>
          <button
            className="icon-button fullscreen"
            aria-label={t("fullscreen")}
            title={t("fullscreen")}
            onClick={fullscreen}
          >
            <Icon name="expand" />
          </button>
          {phase === "playing" ? (
            <button
              className="icon-button"
              aria-label={t("pauseGame")}
              onClick={() => change(() => game.pause())}
            >
              <Icon name="pause" />
            </button>
          ) : (
            <button className="text-button" onClick={() => setHelp(true)}>
              {t("howToPlay")} <span>↗</span>
            </button>
          )}
        </nav>
      </header>
      {phase === "title" && (
        <main className="intro">
          <div className="intro-copy">
            <p className="eyebrow">
              <span /> {t("eyebrowIsland")}
            </p>
            <h1>
              GOONK
              <span>
                Country<span className="title-dot">.</span>
              </span>
            </h1>
            <p className="intro-description">
              {t("tagline1")}
              <br />
              {t("tagline2")}
            </p>
            <div className="intro-cta">
              <button className="primary explore-primary" onClick={openMap} autoFocus>
                {t("map")}
                <Icon name="arrow" />
              </button>
              <button className="secondary" onClick={() => start(game.save.unlocked)}>
                {t(game.save.unlocked ? "continue" : "play")}
              </button>
              <button className="secondary demo-2d-button" onClick={startDemo2D}>
                try 2D demo (1 stage only)
              </button>
            </div>
            <div className="duo-note">
              <div className="portraits">
                <Portrait small />
                <Portrait pink={false} small />
              </div>
              <p>
                {t("roseViolet")}<span>{t("neverApart")}</span>
              </p>
            </div>
          </div>
          <span className="character-note pink-note">
            {tx(L.buddies.rose)}<span>{t("roseTitle")}</span>
          </span>
          <span className="character-note violet-note">
            {tx(L.buddies.violet)}<span>{t("violetTitle")}</span>
          </span>
        </main>
      )}
      {phase === "title" && (
        <footer className="intro-footer">
          <span>
            {t("footerTagline")}
          </span>
          <span>
            {t("footerInput")} <span className="key-outline">↵</span>
          </span>
        </footer>
      )}
      {phase === "playing" && (
        <>
          <div className="hud">
            <div className="team">
              <Portrait pink={game.player.active === 0} />
              <div>
                <strong>{tx(game.player.active ? L.buddies.violet : L.buddies.rose)}{game.mount && ` · ${tx(ANIMAL_DESIGNS[game.mount.kind].name)}`}</strong>
                <div
                  className="hearts"
                  aria-label={t("charactersAvailable", { count: game.player.hp })}
                >
                  <span>♥</span>
                  <span className={game.player.hp < 2 ? "lost" : ""}>♥</span>
                  <small>× {game.lives}</small>
                </div>
              </div>
            </div>
            {!demo2D && (
              <div className="hud-stats">
                <div>
                  <span className="banana-symbol">☽</span>
                  <strong>{String(game.bananas).padStart(2, "0")}</strong>
                  <small>/ 100</small>
                </div>
                <div className="letter-track">
                  {game.letterWord.split("").map((letter, i) => (
                    <span
                      key={i}
                      className={
                        [...game.letters].some(
                          (index) =>
                            game.level.pickups[index]?.letter === letter &&
                            game.level.pickups
                              .filter((p) => p.kind === "letter")
                              .findIndex(
                                (p) => p === game.level.pickups[index],
                              ) === i,
                        )
                          ? "found"
                          : ""
                      }
                    >
                      {letter}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="progress-track">
            <span
              style={{
                width: `${Math.min(100, (game.player.x / game.level.length) * 100)}%`,
              }}
            />
          </div>
          {game.toastTimer > 0 && (
            <div className="toast" role="status">
              <span>✦</span>
              {game.toast}
            </div>
          )}
          {game.levelId === 6 && (
            <div className="boss-health">
              <span>{t("bossName")}</span>
              <div>
                {Array.from({ length: 5 }, (_, n) => (
                  <i
                    key={n}
                    className={n < (game.enemies[0]?.hp ?? 0) ? "alive" : ""}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="keyboard-hint">
            <span>
              <kbd>←</kbd>
              <kbd>→</kbd> {t("hintMove")}
            </span>
            <span>
              <kbd>Space</kbd> {t("hintJump")}
            </span>
            <span>
              <kbd>X</kbd> {t("hintRoll")}
            </span>
            <span>
              <kbd>C</kbd> {t("hintSwap")}
            </span>
            <span>
              <kbd>⇧</kbd> {t("hintRun")}
            </span>
          </div>
          {showControls && <GameControls controls={controls} game={game} />}
        </>
      )}
      {phase === "map" && (
        <div className="overlay map-overlay">
          <div className="map-shell">
            <button
              className="back-link"
              onClick={() =>
                change(() => {
                  game.phase = mapBack.current;
                })
              }
            >
              <Icon name="back" />
              {t("mapBack")}
            </button>
            <div className="map-heading">
              <p className="eyebrow">{t("eyebrowIsland")}</p>
              <h2>{t("mapTitle")}<span>.</span></h2>
              <p id="map-instructions" className="panel-description">{t("mapInstructions")}</p>
            </div>
            <IslandMap selected={mapLevel} initial={game.levelId} unlocked={LEVELS.length - 1} onSelect={setMapLevel} onConfirm={() => start(mapLevel)} stages={MAP_LEVELS}/>
            <div className="map-confirm">
              <p className="map-selection" aria-live="polite" aria-atomic="true">
                <span>{tx(MAP_LEVELS[mapLevel].subtitle)}</span>
                <strong>{tx(MAP_LEVELS[mapLevel].name)}</strong>
              </p>
              <button className="primary map-enter" onClick={() => start(mapLevel)}>
                {t("mapEnter")} <Icon name="arrow" />
              </button>
            </div>
          </div>
        </div>
      )}
      {(phase === "paused" ||
        phase === "clear" ||
        phase === "gameover" ||
        phase === "victory") && (
        <div className="overlay">
          <main className="panel">
            <span className="panel-flower">
              {phase === "gameover" ? "☁" : phase === "paused" ? "❋" : "✦"}
            </span>
            <p className="eyebrow">
              {phase === "paused"
                ? t("panelPauseEyebrow")
                : phase === "gameover"
                  ? t("panelGameoverEyebrow")
                  : phase === "victory"
                    ? t("panelVictoryEyebrow")
                    : t("panelClearEyebrow", {
                        id: String(game.levelId + 1).padStart(2, "0"),
                      })}
            </p>
            <h2>
              {phase === "paused"
                ? t("panelPauseTitle")
                : phase === "clear"
                  ? t("panelClearTitle")
                  : phase === "victory"
                    ? t("panelVictoryTitle")
                    : t("panelGameoverTitle")}
            </h2>
            <p className="panel-description">
              {phase === "paused"
                ? t("panelPauseDesc")
                : phase === "victory"
                  ? t("panelVictoryDesc")
                  : phase === "gameover"
                    ? t("panelGameoverDesc")
                    : t("panelClearDesc")}
            </p>
            {phase !== "paused" && (
              <div className="results">
                <div>
                  <strong>{game.levelBananas}</strong>
                  <span>{t("statBananas")}</span>
                </div>
                <div>
                  <strong>
                    {game.letters.size}
                    <small>/{game.letterWord.length}</small>
                  </strong>
                  <span>{t("statLetters")}</span>
                </div>
                <div>
                  <strong>
                    {Math.floor(game.time)}
                    <small>s</small>
                  </strong>
                  <span>{t("statTime")}</span>
                </div>
              </div>
            )}
            <button
              className="primary"
              onClick={() =>
                phase === "paused"
                  ? change(() => game.pause())
                  : demo2D
                    ? phase === "clear"
                      ? change(() => {
                          setDemo2D(false);
                          game.load(0, "title");
                        })
                      : startDemo2D()
                    : phase === "clear"
                      ? change(() => game.load(game.levelId + 1))
                      : start(phase === "gameover" ? game.levelId : 0)
              }
            >
              {t(
                phase === "paused"
                  ? "resume"
                  : phase === "clear"
                    ? "next"
                    : phase === "gameover"
                      ? "retry"
                      : "play",
              )}
              <Icon name="arrow" />
            </button>
            <button className="secondary panel-secondary" onClick={openMap}>
              {t("map")}
            </button>
          </main>
        </div>
      )}
      {help && (
        <div className="overlay help-overlay">
          <main className="panel help-panel">
            <button
              className="close-button"
              aria-label={t("helpClose")}
              onClick={() => setHelp(false)}
            >
              ×
            </button>
            <p className="eyebrow">{t("helpEyebrow")}</p>
            <h2>
              {t("helpTitle1")}
              <br />
              {t("helpTitle2")}
            </h2>
            <div className="help-rows">
              <p>
                <span>
                  <kbd>←</kbd> <kbd>→</kbd> or <kbd>Q</kbd> <kbd>D</kbd>
                </span>
                {t("helpWalk")}
              </p>
              <p>
                <kbd>Space</kbd>{t("helpJumpSwim")}
              </p>
              <p>
                <kbd>Shift</kbd>{t("helpRun")}
              </p>
              <p>
                <kbd>X</kbd>{t("helpRollBarrel")}
              </p>
              <p>
                <kbd>C</kbd>{t("helpSwapMount")}
              </p>
              <p>
                <kbd>Esc</kbd>{t("helpPause")}
              </p>
            </div>
            <p className="panel-description">{t("helpBody")}</p>
            <p className="save-note">
              {t("helpGamepad")}
              <br />
              {t("helpMobile")}
            </p>
            <button className="primary" onClick={() => setHelp(false)}>
              {t("helpGo")}
              <Icon name="arrow" />
            </button>
          </main>
        </div>
      )}
      {contextLost && (
        <div className="overlay">
          <main className="panel">
            <h2>{t("contextLostTitle")}</h2>
            <p>{t("contextLostBody")}</p>
            <button className="primary" onClick={() => location.reload()}>
              {t("reload")}
            </button>
          </main>
        </div>
      )}
    </div>
  );
}
