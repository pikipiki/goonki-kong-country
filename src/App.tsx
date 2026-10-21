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
import { LEVELS } from "./game/levels";
import { Controls, KEYBOARD } from "./game/input";
import { AudioSystem } from "./game/audio";
import { IslandMap } from "./IslandMap";
import { Scene } from "./Scene";
import { GameControls } from "./components/GameControls";

const STORAGE = "goonk-country-v1";
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
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="webgl-fallback">
        <h2>L’affichage 3D a été interrompu.</h2>
        <p>Recharge la page pour retrouver l’aventure.</p>
        <button className="primary" onClick={() => location.reload()}>
          Recharger
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
  const [mapLevel, setMapLevel] = useState(0);
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
      change(() => game.start(id, id === 0));
    },
    [audio, change, game],
  );
  const openMap = () =>
    change(() => {
      setMapLevel(game.levelId);
      mapBack.current = game.phase === "title" ? "title" : "paused";
      game.phase = "map";
    });
  const phase = game.phase;
  useEffect(() => {
    game.onEvent = (name) => audio.effect(name,{character:game.player.active,animal:game.mount?.kind,letterIndex:game.letters.size-1});
    audio.onError = message => game.message(message);
    game.onSave = (save) => {
      try {
        localStorage.setItem(STORAGE, JSON.stringify(save));
      } catch {
        game.message("Sauvegarde indisponible dans ce navigateur.");
      }
    };
  }, [game, audio]);
  useEffect(() => {
    if (phase === "playing") audio.play(game.level.biome);
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
        e.preventDefault();
        start(game.save.unlocked);
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
          game.message("Utilise le mode plein écran de ton navigateur."),
        );
  };
  return (
    <div
      ref={root}
      className={`app phase-${phase} ${showControls ? "has-controls" : ""}`}
    >
      <div className="scene" aria-label="Scène du jeu en trois dimensions">
        <SceneBoundary>
          <Scene game={game} input={controls.input} onTick={tick} />
        </SceneBoundary>
      </div>
      <div className="vignette" />
      <div className="film-grain" />
      <header className="topbar">
        <button
          className="brand"
          onClick={() =>
            change(() => {
              game.load(0, "title");
            })
          }
          aria-label="Goonk Country, accueil"
        >
          <span className="brand-mark">g.</span>
          <span>
            GOONK<span className="brand-sub">COUNTRY</span>
          </span>
        </button>
        {phase === "playing" && (
          <div className="stage-name">
            <span>{String(game.levelId + 1).padStart(2, "0")} / 07</span>
            {game.level.name}
          </div>
        )}
        <nav className="top-actions" aria-label="Options du jeu">
          {phase === "playing" && (
            <button
              className="icon-button control-toggle"
              aria-label={
                showControls
                  ? "Masquer la manette virtuelle"
                  : "Afficher la manette virtuelle"
              }
              title="Manette virtuelle"
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
            aria-label={muted ? "Activer le son" : "Couper le son"}
            title={muted ? "Activer le son" : "Couper le son"}
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
            aria-label="Plein écran"
            title="Plein écran"
            onClick={fullscreen}
          >
            <Icon name="expand" />
          </button>
          {phase === "playing" ? (
            <button
              className="icon-button"
              aria-label="Mettre en pause"
              onClick={() => change(() => game.pause())}
            >
              <Icon name="pause" />
            </button>
          ) : (
            <button className="text-button" onClick={() => setHelp(true)}>
              Comment jouer <span>↗</span>
            </button>
          )}
        </nav>
      </header>
      {phase === "title" && (
        <main className="intro">
          <div className="intro-copy">
            <p className="eyebrow">
              <span /> L’ÎLE AUX DEUX PELUCHES
            </p>
            <h1>
              GOONK
              <span>
                Country<span className="title-dot">.</span>
              </span>
            </h1>
            <p className="intro-description">
              Deux petites peluches.
              <br />
              Une très grande aventure.
            </p>
            <div className="intro-cta">
              <button
                className="primary"
                onClick={() => start(game.save.unlocked)}
              >
                {t(game.save.unlocked ? "continue" : "play")}
                <Icon name="arrow" />
              </button>
              <button className="secondary" onClick={openMap}>
                {t("map")}
                <span>07 étapes</span>
              </button>
            </div>
            <div className="duo-note">
              <div className="portraits">
                <Portrait small />
                <Portrait pink={false} small />
              </div>
              <p>
                Rose & Violette<span>Jamais l’une sans l’autre.</span>
              </p>
            </div>
          </div>
          <span className="character-note pink-note">
            Rose<span>LA FORCE TRANQUILLE</span>
          </span>
          <span className="character-note violet-note">
            Violette<span>L’ÉNERGIE PURE</span>
          </span>
        </main>
      )}
      {phase === "title" && (
        <footer className="intro-footer">
          <span>
            UNE AVENTURE FAITE DE DOUCEUR <i>✦</i> ET D’UN PEU DE COURAGE
          </span>
          <span>
            CLAVIER · MANETTE · TACTILE <span className="key-outline">↵</span>
          </span>
        </footer>
      )}
      {phase === "playing" && (
        <>
          <div className="hud">
            <div className="team">
              <Portrait pink={game.player.active === 0} />
              <div>
                <strong>{game.player.active ? "Violette" : "Rose"}{game.mount && ` · ${ANIMAL_DESIGNS[game.mount.kind].name}`}</strong>
                <div
                  className="hearts"
                  aria-label={`${game.player.hp} personnages disponibles`}
                >
                  <span>♥</span>
                  <span className={game.player.hp < 2 ? "lost" : ""}>♥</span>
                  <small>× {game.lives}</small>
                </div>
              </div>
            </div>
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
                          game.level.pickups[index].letter === letter &&
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
              <span>LE ROI DES VOLEURS</span>
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
              <kbd>→</kbd> Se déplacer
            </span>
            <span>
              <kbd>Espace</kbd> Sauter
            </span>
            <span>
              <kbd>X</kbd> Roulade / tonneau
            </span>
            <span>
              <kbd>C</kbd> Changer
            </span>
            <span>
              <kbd>⇧</kbd> Courir
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
              Retour
            </button>
            <p className="eyebrow">CHAQUE ÉTAPE, UNE NOUVELLE HISTOIRE</p>
            <h2>
              Une île à explorer<span>.</span>
            </h2>
            <p className="panel-description">
              De la première feuille au dernier tonneau. Ensemble.
            </p>
            <IslandMap selected={mapLevel} initial={game.levelId} unlocked={game.save.unlocked} onSelect={setMapLevel}/>
            <button className="primary map-enter" onClick={() => start(mapLevel)}>
              Entrer · {mapLevel === 0 ? ROM_JUNGLE.name : LEVELS[mapLevel].name}
            </button>
            <p className="save-note">Choisis une étape ouverte : Rose et Violette la rejoignent sur la carte.</p>
            <div className="level-grid">
              {LEVELS.map((level, i) => {
                const unlocked = i <= game.save.unlocked,
                  best = game.save.best[i];
                return (
                  <button
                    key={i}
                    disabled={!unlocked}
                    className={`level-card biome-${level.biome} ${best ? "completed" : ""} ${mapLevel === i ? "map-selected" : ""}`}
                    aria-pressed={mapLevel === i}
                    onClick={() => setMapLevel(i)}
                  >
                    <div className="level-art">
                      <span className="level-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="island-icon">
                        {["❋", "♧", "◇", "≈", "❄", "⌘", "♜"][i]}
                      </span>
                      <span className="level-lock">
                        {!unlocked
                          ? "Verrouillé"
                          : best
                            ? "✓ Exploré"
                            : "À découvrir"}
                      </span>
                    </div>
                    <span className="level-region">{level.subtitle}</span>
                    <strong>{i===0?ROM_JUNGLE.name:level.name}</strong>
                    <small>
                      {best
                        ? `${best.letters}/${i===0?4:5} lettres · ${Math.floor(best.time)} s`
                        : "Le voyage vous attend"}
                    </small>
                  </button>
                );
              })}
            </div>
            <p className="save-note">
              ✦ Progression sauvegardée automatiquement sur cet appareil.
            </p>
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
                ? "UN PETIT INSTANT"
                : phase === "gameover"
                  ? "ON NE BAISSE PAS LES BRAS"
                  : phase === "victory"
                    ? "L’ÎLE VOUS DIT MERCI"
                    : `ÉTAPE ${String(game.levelId + 1).padStart(2, "0")} TERMINÉE`}
            </p>
            <h2>
              {phase === "paused"
                ? "Une petite pause."
                : phase === "clear"
                  ? "Bien joué, les Goonk !"
                  : phase === "victory"
                    ? "Ensemble, jusqu’au bout."
                    : "Encore une aventure ?"}
            </h2>
            <p className="panel-description">
              {phase === "paused"
                ? "L’aventure sera toujours là à votre retour."
                : phase === "victory"
                  ? "Les bananes sont de retour. Les deux amies peuvent enfin souffler."
                  : phase === "gameover"
                    ? "La jungle garde encore quelques secrets pour vous."
                    : "Un pas de plus vers le cœur de l’île."}
            </p>
            {phase !== "paused" && (
              <div className="results">
                <div>
                  <strong>{game.levelBananas}</strong>
                  <span>BANANES</span>
                </div>
                <div>
                  <strong>
                    {game.letters.size}
                    <small>/5</small>
                  </strong>
                  <span>LETTRES</span>
                </div>
                <div>
                  <strong>
                    {Math.floor(game.time)}
                    <small>s</small>
                  </strong>
                  <span>EXPLORATION</span>
                </div>
              </div>
            )}
            <button
              className="primary"
              onClick={() =>
                phase === "paused"
                  ? change(() => game.pause())
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
              aria-label="Fermer les commandes"
              onClick={() => setHelp(false)}
            >
              ×
            </button>
            <p className="eyebrow">PRENEZ LA ROUTE À DEUX</p>
            <h2>
              Un peu de courage.
              <br />
              Quelques touches.
            </h2>
            <div className="help-rows">
              <p>
                <span>
                  <kbd>←</kbd> <kbd>→</kbd> ou <kbd>Q</kbd> <kbd>D</kbd>
                </span>
                Marcher
              </p>
              <p>
                <kbd>Espace</kbd>Sauter / nager
              </p>
              <p>
                <kbd>Maj</kbd>Courir
              </p>
              <p>
                <kbd>X</kbd>Roulade, ramasser et lancer un tonneau
              </p>
              <p>
                <kbd>C</kbd>Changer de peluche / descendre de l’animal
              </p>
              <p>
                <kbd>Échap</kbd>Faire une pause
              </p>
            </div>
            <p className="panel-description">
              Maintenez le saut pour monter plus haut. Rose terrasse les ennemis
              casqués ; Violette court plus vite. Récupérez 100 bananes ou les
              lettres de l’étape pour gagner une vie. Une roulade prolonge le
              saut au-delà du rebord et accélère en enchaînant les ennemis.
              Libérez les animaux des caisses puis sautez sur leur dos : Rambi
              utilise sa corne, Winky bondit très haut, Expresso plane quand le
              saut est maintenu, Enguarde nage dans toutes les directions et
              attaque avec son rostre. Le bouton Changer permet de descendre.
            </p>
            <p className="save-note">
              Manette : A sauter · X action · B changer · RB courir
              <br />
              Sur mobile : glisser à gauche pour diriger, grands boutons à
              droite. Le mode clic maintient la direction jusqu’au prochain
              clic.
            </p>
            <button className="primary" onClick={() => setHelp(false)}>
              C’est parti
              <Icon name="arrow" />
            </button>
          </main>
        </div>
      )}
      {contextLost && (
        <div className="overlay">
          <main className="panel">
            <h2>Une pause technique.</h2>
            <p>Le navigateur a interrompu l’affichage 3D.</p>
            <button className="primary" onClick={() => location.reload()}>
              Recharger
            </button>
          </main>
        </div>
      )}
    </div>
  );
}
