import { useState, useEffect, useRef, useCallback } from "react";
import { FISH as REGISTRY_FISH } from "../lib/fish-registry.js";
import { DECORATION_CATALOG, getDecoration, decoImg, DECO_SCALE } from "../lib/decorations.js";
import "./sidepanel.css";

const RARITY_COLORS = { common: "#94a3b8", uncommon: "#22c55e", rare: "#38bdf8", legendary: "#f59e0b" };
const RARITY_GLOW   = { common: "rgba(148,163,184,0.5)", uncommon: "rgba(34,197,94,0.6)", rare: "rgba(56,189,248,0.6)", legendary: "rgba(245,158,11,0.7)" };
const RARITY_RANK   = { legendary: 4, rare: 3, uncommon: 2, common: 1 };
const SELL_PRICES   = { common: 15, uncommon: 50, rare: 175, legendary: 600 };
const sizeToSpeed   = (size) => 22 / size;
const sizeToPx      = (size) => Math.min(48, Math.round(size * 1.4));

// ── Item art (rods & baits live in /items) ──────────────────────────────────────
// Filenames: bait_<baitId>.png, <rodId>_rod.png, <rodId>_rod_bait_<baitId>.png
const baitImg  = (baitId)        => `/items/bait_${baitId}.png`;
const rodImg   = (rodId)         => `/items/${rodId}_rod.png`;
const comboImg = (rodId, baitId) => `/items/${rodId}_rod_bait_${baitId}.png`;

// ── Bait system ───────────────────────────────────────────────────────────────
// ids match the bait_<id>.png asset names so combo art can be resolved.

const BAIT_TYPES = [
  { id: "basic",        name: "Doughball Bait", img: baitImg("basic"),        rarity: "common",    boost: 0,    price: 25,  description: "Gets the job done. Barely." },
  { id: "green",        name: "Algae Bait",     img: baitImg("green"),        rarity: "common",    boost: 0.12, price: 75,  description: "Fresh and grassy. Fish nibble politely." },
  { id: "red",          name: "Roe Bait",       img: baitImg("red"),          rarity: "uncommon",  boost: 0.22, price: 150, description: "Bright and juicy. Hard to ignore." },
  { id: "black",        name: "Boilie Bait",    img: baitImg("black"),        rarity: "uncommon",  boost: 0.32, price: 250, description: "Dense and dark. Sinks to the good spots." },
  { id: "fish",         name: "Cut Bait",       img: baitImg("fish"),         rarity: "rare",      boost: 0.42, price: 400, description: "A chunk of the real thing. Predators love it." },
  { id: "fish_black",   name: "Chum Bait",      img: baitImg("fish_black"),   rarity: "rare",      boost: 0.52, price: 600, description: "A trail of temptation. Draws a crowd." },
  { id: "yellow_point", name: "Amber Bait",     img: baitImg("yellow_point"), rarity: "legendary", boost: 0.63, price: 850, description: "Glints like treasure. Rare fish circle in." },
  { id: "golden",       name: "Golden Bait",    img: baitImg("golden"),       rarity: "legendary", boost: 0.75, price: 1200, description: "Dark arts. Almost guarantees something extraordinary." },
];

// ── Rod system ────────────────────────────────────────────────────────────────
// ids match the <id>_rod.png asset names.

const ROD_TYPES = [
  { id: "basic", name: "Basic Rod",  img: rodImg("basic"), price: 0,    rodBoost: 0,    description: "A trusty rod. Gets the job done." },
  { id: "black", name: "Carbon Rod", img: rodImg("black"), price: 2500,  rodBoost: 0.12, description: "Stiff and sensitive. Improved odds." },
  { id: "blue",  name: "Tidal Rod",  img: rodImg("blue"),  price: 8000,  rodBoost: 0.22, description: "Tuned for the deep. Serious power." },
  { id: "pink",  name: "Coral Rod",  img: rodImg("pink"),  price: 30000, rodBoost: 0.35, description: "Forged from rare catches. The finest cast." },
];

// ── Fish helpers ──────────────────────────────────────────────────────────────

function getRarityWeights(boost = 0) {
  return {
    common:    Math.max(4,  70 - boost * 55),
    uncommon:  22 + boost * 8,
    rare:       6 + boost * 24,
    legendary:  1 + boost * 3,
  };
}

function oddsPercent(boost) {
  const w = getRarityWeights(boost);
  const t = Object.values(w).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, Math.round(v / t * 100)]));
}

const MOCK_BAIT_INVENTORY = BAIT_TYPES.map((b, i) => ({ ...b, count: [3, 2, 1, 0, 0, 0, 0, 0][i] }));

const ALL_FISH = REGISTRY_FISH;

const _now = Date.now();
const MOCK_CATCHES = [
  { ...ALL_FISH.find(f => f.id === "anglerfish"), caughtAt: _now - 1000 * 60 * 5 },
  { ...ALL_FISH.find(f => f.id === "axolotl"),    caughtAt: _now - 1000 * 60 * 42 },
  { ...ALL_FISH.find(f => f.id === "sunfish"),    caughtAt: _now - 1000 * 60 * 60 * 3 },
  { ...ALL_FISH.find(f => f.id === "octopus"),    caughtAt: _now - 1000 * 60 * 60 * 11 },
  { ...ALL_FISH.find(f => f.id === "clownfish"),  caughtAt: _now - 1000 * 60 * 60 * 26 },
  { ...ALL_FISH.find(f => f.id === "koi"),        caughtAt: _now - 1000 * 60 * 60 * 48 },
  { ...ALL_FISH.find(f => f.id === "pirahna"),    caughtAt: _now - 1000 * 60 * 60 * 72 },
];

// ── Physics aquarium ──────────────────────────────────────────────────────────

function Aquarium({ fish, decorations, onMoveDecoration, scale = DECO_SCALE.panel, maxDecorations = Infinity, readOnly = false }) {
  const containerRef = useRef(null);
  const elemsRef     = useRef([]);
  const stateRef     = useRef([]);
  const rafRef       = useRef(null);

  const fishIds = fish.map(f => f.id).join(",");
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const existingById = Object.fromEntries(stateRef.current.map(s => [s.id, s]));
    const SEABED_INIT = 22;
    stateRef.current = fish.map((f) => {
      if (existingById[f.id]) return existingById[f.id];
      const isGround = !!f.ground;
      const spd   = isGround ? sizeToSpeed(f.size) * 0.35 : sizeToSpeed(f.size);
      const angle = isGround ? (Math.random() < 0.5 ? 0 : Math.PI) : Math.random() * Math.PI * 2;
      const vx0   = Math.cos(angle) * spd;
      const halfPx = sizeToPx(f.size) / 2;
      return {
        id: f.id,
        halfPx,
        ground: isGround,
        x: 40 + Math.random() * (W - 80),
        y: isGround ? H - SEABED_INIT - halfPx : 30 + Math.random() * (H - 100),
        vx: vx0,
        vy: isGround ? 0 : Math.sin(angle) * spd,
        baseSpeed: spd,
        bobPhase: Math.random() * Math.PI * 2,
        wanderStrength: isGround ? 0.002 : 0.010 + Math.random() * 0.006,
        faceRight: vx0 >= 0,
        flipCooldown: 0,
        fleeTtl: 0,
        fleeVx: 0,
        fleeVy: 0,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fishIds]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const SEABED     = 22;
    const MARGIN     = 14;
    const WALL_RANGE = 48;
    const WALL_FORCE = 0.12;

    function tick() {
      const W = container.clientWidth;
      const H = container.clientHeight;
      stateRef.current.forEach((s, i) => {
        const bottomLimit = H - SEABED - s.halfPx;
        s.bobPhase += 0.028;

        if (s.ground) {
          s.y = bottomLimit;
          s.vy = 0;
          if (Math.random() < 0.005) s.vx = -s.vx;
          const spdMod = 1 + Math.sin(s.bobPhase) * 0.15;
          const dir = s.vx >= 0 ? 1 : -1;
          s.vx = dir * s.baseSpeed * spdMod;
          if (s.fleeTtl > 0) {
            s.vx += s.fleeVx;
            s.fleeVx *= 0.88;
            s.fleeTtl--;
          }
          s.x += s.vx;
          if (s.x < MARGIN)     { s.x = MARGIN;     s.vx = Math.abs(s.vx); }
          if (s.x > W - MARGIN) { s.x = W - MARGIN; s.vx = -Math.abs(s.vx); }
          if (s.flipCooldown > 0) {
            s.flipCooldown--;
          } else if ((s.vx > 0) !== s.faceRight) {
            s.faceRight = s.vx > 0;
            s.flipCooldown = 45;
          }
          const el = elemsRef.current[i];
          if (el) {
            el.style.left      = `${s.x}px`;
            el.style.top       = `${s.y}px`;
            el.style.transform = `translate(-50%,-50%) scaleX(${s.faceRight ? 1 : -1})`;
          }
          return;
        }

        const speedMod  = 1 + Math.sin(s.bobPhase) * 0.28;
        const targetSpd = s.baseSpeed * speedMod;
        const wanderAngle = (Math.random() - 0.5) * s.wanderStrength;
        const cosW = Math.cos(wanderAngle), sinW = Math.sin(wanderAngle);
        const wvx = s.vx * cosW - s.vy * sinW;
        const wvy = s.vx * sinW + s.vy * cosW;
        s.vx = wvx; s.vy = wvy;
        const spd = Math.sqrt(s.vx * s.vx + s.vy * s.vy) || 1;
        s.vx = (s.vx / spd) * targetSpd;
        s.vy = (s.vy / spd) * targetSpd;
        if (s.x < WALL_RANGE)            s.vx += WALL_FORCE * (1 - s.x / WALL_RANGE);
        if (s.x > W - WALL_RANGE)        s.vx -= WALL_FORCE * (1 - (W - s.x) / WALL_RANGE);
        if (s.y < WALL_RANGE)            s.vy += WALL_FORCE * (1 - s.y / WALL_RANGE);
        if (s.y > bottomLimit - WALL_RANGE) s.vy -= WALL_FORCE * (1 - (bottomLimit - s.y) / WALL_RANGE);
        if (s.fleeTtl > 0) {
          s.vx += s.fleeVx; s.vy += s.fleeVy;
          s.fleeVx *= 0.88; s.fleeVy *= 0.88;
          s.fleeTtl--;
        }
        s.x += s.vx; s.y += s.vy;
        if (s.x < MARGIN)      { s.x = MARGIN;       s.vx =  Math.abs(s.vx); }
        if (s.x > W - MARGIN)  { s.x = W - MARGIN;   s.vx = -Math.abs(s.vx); }
        if (s.y < MARGIN)      { s.y = MARGIN;        s.vy =  Math.abs(s.vy); }
        if (s.y > bottomLimit) { s.y = bottomLimit;   s.vy = -Math.abs(s.vy); }
        if (s.flipCooldown > 0) {
          s.flipCooldown--;
        } else if ((s.vx > 0) !== s.faceRight) {
          s.faceRight    = s.vx > 0;
          s.flipCooldown = 45;
        }
        const wagOffset = Math.sin(s.bobPhase * 1.8) * 2;
        const el = elemsRef.current[i];
        if (el) {
          el.style.left      = `${s.x}px`;
          el.style.top       = `${s.y + wagOffset}px`;
          el.style.transform = `translate(-50%,-50%) scaleX(${s.faceRight ? 1 : -1})`;
        }
      });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [fish]);

  const handleClick = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const diag   = Math.sqrt(rect.width ** 2 + rect.height ** 2);
    const ripple = document.createElement("div");
    ripple.className = "tank-ripple";
    ripple.style.left = `${clickX}px`;
    ripple.style.top  = `${clickY}px`;
    containerRef.current.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    stateRef.current.forEach((s) => {
      const dx   = s.x - clickX;
      const dy   = s.y - clickY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const strength = Math.max(0.3, 1 - dist / diag) * s.baseSpeed * 5;
      const angle    = Math.atan2(dy, dx);
      s.fleeVx  = Math.cos(angle) * strength * 0.25;
      s.fleeVy  = Math.sin(angle) * strength * 0.25;
      s.fleeTtl = 28;
    });
  }, []);

  function handleDecoDragStart(e, decId) {
    e.stopPropagation();
    const tank = containerRef.current;
    if (!tank) return;
    const rect = tank.getBoundingClientRect();

    function onMove(ev) {
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      onMoveDecoration(decId, Math.max(5, Math.min(92, x)));
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <div className="tank" ref={containerRef} onClick={handleClick}>
      <div className="water-shimmer" />
      <div className="bubbles">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bubble" style={{ left: `${4 + i * 10}%`, animationDelay: `${i * 0.5}s`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
        ))}
      </div>

      {fish.map((f, i) => {
        const px = sizeToPx(f.size);
        return (
          <div
            key={f.id}
            ref={el => elemsRef.current[i] = el}
            className="tank-fish"
            title={`${f.name} · ${f.rarity}`}
          >
            <img src={f.img} alt={f.name} style={{ width: px, height: px }} className="fish-sprite" />
          </div>
        );
      })}

      <div className="tank-seabed">
        <div className="seaweed" style={{ left: "8%",  height: 30, animationDelay: "0s" }} />
        <div className="seaweed" style={{ left: "40%", height: 22, animationDelay: "-1.2s" }} />
        <div className="seaweed" style={{ right: "12%",height: 36, animationDelay: "-2.1s" }} />

        {decorations.map(dec => {
          const meta = getDecoration(dec.id);
          if (!meta) return null;
          const depthClass = meta.depth === "back" ? "tank-decoration--back" : "tank-decoration--front";
          const roClass    = readOnly ? "tank-decoration--readonly" : "";
          return (
            <div
              key={dec.uid || dec.id}
              className={`tank-decoration ${depthClass} ${roClass}`}
              style={{ left: `${dec.xPos}%` }}
              onMouseDown={readOnly ? undefined : e => handleDecoDragStart(e, dec.uid || dec.id)}
              title={readOnly ? meta.name : `${meta.name} — drag to reposition`}
            >
              <img
                className="tank-decoration-img"
                src={decoImg(meta.file)}
                alt={meta.name}
                draggable={false}
                style={{ width: meta.w * scale * (meta.scale ?? 1), height: meta.h * scale * (meta.scale ?? 1) }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Single bait bob ──────────────────────────────────────────────────────────

function BaitBob({ cast, onCatch }) {
  const [phase, setPhase] = useState('bobbing');

  useEffect(() => {
    const waitMs = 1200 + Math.random() * 800;
    const t1 = setTimeout(() => setPhase('nibble'), waitMs);
    const t2 = setTimeout(() => {
      setPhase('caught');
      onCatch(cast);
    }, waitMs + 600);
    return () => [t1, t2].forEach(clearTimeout);
  }, []);

  return (
    <div className="fs-bob-slot" style={{ left: `${cast.x}%`, top: `${cast.y}%` }}>
      {phase !== 'caught' ? (
        <>
          <div className={`fs-bait-wrap ${phase}`}>
            <img className="fs-bait-sprite item-art" src={baitImg(cast.baitId)} alt="bait" />
          </div>
          <div className={`fs-ripples ${phase}`}>
            <div className="fs-ripple r1" />
            <div className="fs-ripple r2" />
          </div>
        </>
      ) : (
        <div className="fs-bob-caught">
          <img src={cast.fish.img} alt={cast.fish.name} className="fish-sprite fs-bob-caught-fish" />
        </div>
      )}
    </div>
  );
}

// ── Fishing overlay ──────────────────────────────────────────────────────────

function FishingOverlay({ casts, catchLog, onCatch }) {
  return (
    <div className="fs-overlay">
      <div className="fs-card">
        <div className="fs-water-bg">
          <div className="fs-light-rays" />
          <div className="fs-bubbles-bg">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="fs-mini-bubble" style={{
                left: `${10 + i * 11}%`,
                animationDelay: `${i * 0.4}s`,
                width: `${3 + (i % 3) * 2}px`,
                height: `${3 + (i % 3) * 2}px`,
              }} />
            ))}
          </div>
        </div>
        <div className="fs-bait-field">
          {casts.map(c => (
            <BaitBob key={c.id} cast={c} onCatch={onCatch} />
          ))}
        </div>
      </div>
      <CatchLog entries={catchLog} />
    </div>
  );
}

// ── Catch log feed ───────────────────────────────────────────────────────────

function CatchLog({ entries }) {
  if (entries.length === 0) return null;
  return (
    <div className="catch-log">
      {entries.map(e => (
        <div key={e.id} className="catch-log-entry" style={{ '--rarity-color': RARITY_COLORS[e.fish.rarity] }}>
          <img src={e.fish.img} alt={e.fish.name} className="fish-sprite catch-log-icon" />
          <span className="catch-log-text">
            <strong style={{ color: RARITY_COLORS[e.fish.rarity] }}>{e.fish.name}</strong> was caught!
          </span>
          {e.isNew && <span className="catch-log-new">NEW</span>}
        </div>
      ))}
    </div>
  );
}

// ── Bait inventory bottom sheet ───────────────────────────────────────────────

function BaitInventory({ inventory, selected, onSelect, onClose, closing, onClosed }) {
  return (
    <>
      <div className={`bait-sheet-backdrop${closing ? ' closing' : ''}`} onClick={onClose} />
      <div className={`bait-sheet${closing ? ' closing' : ''}`} onAnimationEnd={closing ? onClosed : undefined}>
        <div className="bait-sheet-handle" />
        <div className="bait-sheet-title">Select Bait</div>
        {inventory.map(bait => {
          const odds  = oddsPercent(bait.boost);
          const empty = bait.count === 0;
          const sel   = selected?.id === bait.id;
          return (
            <div
              key={bait.id}
              className={`bait-option${sel ? ' selected' : ''}${empty ? ' empty' : ''}`}
              onClick={() => { if (!empty) { onSelect(bait); onClose(); } }}
            >
              <img className="bait-option-emoji item-art" src={bait.img} alt={bait.name} />
              <div className="bait-option-info">
                <div className="bait-option-name">{bait.name}</div>
                <div className="bait-option-desc">{bait.description}</div>
                <div className="bait-odds-row">
                  {['common','uncommon','rare','legendary'].map(r => (
                    <span key={r} className={`odds-chip ${r}`}>{odds[r]}%</span>
                  ))}
                </div>
              </div>
              <div className="bait-option-right">
                <span className="bait-option-count">{bait.count}x</span>
                {sel && <span className="bait-option-check">✓</span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Bag menu ──────────────────────────────────────────────────────────────────

function BagMenu({ inventory, selectedBait, equippedRod, ownedRodIds, onSelectBait, onSelectRod, onClose, closing, onClosed }) {
  const [view, setView] = useState("main");

  return (
    <>
      <div className={`bait-sheet-backdrop${closing ? ' closing' : ''}`} onClick={onClose} />
      <div className={`bait-sheet bag-sheet${closing ? ' closing' : ''}`} onAnimationEnd={closing ? onClosed : undefined}>
        <div className="bait-sheet-handle" />
        <div className="bait-sheet-title">
          {view === "main" && "🎒 Loadout"}
          {view === "rod"  && "Select Rod"}
          {view === "bait" && "Select Bait"}
        </div>

        {view === "main" && (
          <>
            <div className="bag-row" onClick={() => setView("rod")}>
              <img className="bag-row-icon item-art" src={equippedRod.img} alt={equippedRod.name} />
              <div className="bag-row-info">
                <div className="bag-row-label">Rod</div>
                <div className="bag-row-name">{equippedRod.name}</div>
              </div>
              <span className="bag-row-change">Change →</span>
            </div>
            <div className="bag-row" onClick={() => setView("bait")}>
              <img className="bag-row-icon item-art" src={selectedBait.img} alt={selectedBait.name} />
              <div className="bag-row-info">
                <div className="bag-row-label">Bait</div>
                <div className="bag-row-name">{selectedBait.name} <span className="bag-row-count">({inventory.find(b => b.id === selectedBait.id)?.count ?? 0}x)</span></div>
              </div>
              <span className="bag-row-change">Change →</span>
            </div>
          </>
        )}

        {view === "rod" && ROD_TYPES.filter(r => ownedRodIds.has(r.id)).map(rod => {
          const sel = equippedRod.id === rod.id;
          return (
            <div key={rod.id} className={`bait-option${sel ? ' selected' : ''}`} onClick={() => { onSelectRod(rod); setView("main"); onClose(); }}>
              <img className="bait-option-emoji item-art" src={rod.img} alt={rod.name} />
              <div className="bait-option-info">
                <div className="bait-option-name">{rod.name}</div>
                <div className="bait-option-desc">{rod.description}</div>
                <div className="bait-odds-row">
                  <span className="odds-chip rare">+{Math.round(rod.rodBoost * 100)}% odds boost</span>
                </div>
              </div>
              <div className="bait-option-right">
                {sel && <span className="bait-option-check">✓</span>}
              </div>
            </div>
          );
        })}

        {view === "bait" && inventory.map(bait => {
          const odds  = oddsPercent(bait.boost);
          const empty = bait.count === 0;
          const sel   = selectedBait?.id === bait.id;
          return (
            <div
              key={bait.id}
              className={`bait-option${sel ? ' selected' : ''}${empty ? ' empty' : ''}`}
              onClick={() => { if (!empty) { onSelectBait(bait); setView("main"); onClose(); } }}
            >
              <img className="bait-option-emoji item-art" src={bait.img} alt={bait.name} />
              <div className="bait-option-info">
                <div className="bait-option-name">{bait.name}</div>
                <div className="bait-option-desc">{bait.description}</div>
                <div className="bait-odds-row">
                  {['common','uncommon','rare','legendary'].map(r => (
                    <span key={r} className={`odds-chip ${r}`}>{odds[r]}%</span>
                  ))}
                </div>
              </div>
              <div className="bait-option-right">
                <span className="bait-option-count">{bait.count}x</span>
                {sel && <span className="bait-option-check">✓</span>}
              </div>
            </div>
          );
        })}

        {view !== "main" && (
          <button className="bag-back-btn" onClick={() => setView("main")}>← Back</button>
        )}
      </div>
    </>
  );
}

// ── Market ────────────────────────────────────────────────────────────────────

const MARKET_TABS = [
  { id: "fish",  label: "Fish Market", emoji: "🐟" },
  { id: "baits", label: "Baits",       emoji: "🪱" },
  { id: "rods",  label: "Rods",        emoji: "🎣" },
  { id: "decos", label: "Decorations", emoji: "🏚️" },
];

function Market({ catches, inventory, goldCoins, ownedRodIds, ownedDecorations, onClose, onSellFish, onSellAllFish, onBuyBait, onBuyRod, onBuyDecoration }) {
  const [tab, setTab] = useState("fish");
  const [baitQty, setBaitQty] = useState(() => Object.fromEntries(BAIT_TYPES.map(b => [b.id, 1])));
  const [toast, setToast] = useState(null);
  const toastRef = useRef(null);

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 2200);
  }

  function setQty(baitId, delta) {
    setBaitQty(prev => {
      const bait = BAIT_TYPES.find(b => b.id === baitId);
      const maxAffordable = Math.max(1, Math.floor(goldCoins / bait.price));
      const next = Math.min(maxAffordable, Math.max(1, (prev[baitId] || 1) + delta));
      return { ...prev, [baitId]: next };
    });
  }

  return (
    <div className="market-overlay">
      <div className="market-modal">
        <div className="market-header">
          <div className="market-title">🏪 Market</div>
          <div className="market-gold">🪙 {goldCoins}</div>
          <button className="market-close" onClick={onClose}>✕</button>
        </div>
        {toast && <div className="market-toast">{toast}</div>}

        <div className="market-tabs">
          {MARKET_TABS.map(t => (
            <button key={t.id} className={`market-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="market-content">
          {tab === "fish" && (
            catches.length === 0
              ? <div className="market-empty">No fish to sell. Go fishing first!</div>
              : <>
                  <div className="market-sell-all-row">
                    <span className="market-sell-all-label">{catches.length} fish · 🪙 {catches.reduce((s, f) => s + SELL_PRICES[f.rarity], 0)} total</span>
                    <button className="market-sell-all-btn" onClick={() => { onSellAllFish(); showToast(`Sold ${catches.length} fish for 🪙 ${catches.reduce((s, f) => s + SELL_PRICES[f.rarity], 0)}!`); }}>Sell All</button>
                  </div>
                  {catches.map(fish => (
                    <div key={fish.id} className="market-row">
                      <img src={fish.img} alt={fish.name} className="fish-sprite market-fish-icon" />
                      <div className="market-row-info">
                        <div className="market-row-name">{fish.name}</div>
                        <div className="market-row-rarity" style={{ color: RARITY_COLORS[fish.rarity] }}>{fish.rarity}</div>
                      </div>
                      <button className="market-sell-btn" onClick={() => onSellFish(fish)}>
                        Sell · 🪙 {SELL_PRICES[fish.rarity]}
                      </button>
                    </div>
                  ))}
                </>
          )}

          {tab === "baits" && BAIT_TYPES.map(bait => {
            const owned = inventory.find(b => b.id === bait.id)?.count ?? 0;
            const qty = baitQty[bait.id] || 1;
            const totalCost = bait.price * qty;
            const canAfford = goldCoins >= totalCost;
            const canAffordOne = goldCoins >= bait.price;
            return (
              <div key={bait.id} className="market-row">
                <img className="market-row-emoji item-art" src={bait.img} alt={bait.name} />
                <div className="market-row-info">
                  <div className="market-row-name">{bait.name}</div>
                  <div className="market-row-desc">{bait.description}</div>
                  <div className="market-row-stock">In bag: {owned}x</div>
                </div>
                <div className="market-buy-ctrl">
                  <div className="market-qty-stepper">
                    <button className="market-qty-btn" onClick={() => setQty(bait.id, -1)} disabled={qty <= 1}>-</button>
                    <span className="market-qty-val">{qty}</span>
                    <button className="market-qty-btn" onClick={() => setQty(bait.id, 1)} disabled={!canAffordOne}>+</button>
                  </div>
                  <button
                    className={`market-buy-btn${!canAfford ? ' disabled' : ''}`}
                    onClick={() => { if (canAfford) { onBuyBait(bait, qty); showToast(`Bought ${qty}x ${bait.name}!`); setBaitQty(prev => ({ ...prev, [bait.id]: 1 })); } }}
                    disabled={!canAfford}
                  >
                    🪙 {totalCost}
                  </button>
                </div>
              </div>
            );
          })}

          {tab === "rods" && ROD_TYPES.map(rod => {
            const owned = ownedRodIds.has(rod.id);
            const canAfford = goldCoins >= rod.price;
            return (
              <div key={rod.id} className="market-row">
                <img className="market-row-emoji item-art" src={rod.img} alt={rod.name} />
                <div className="market-row-info">
                  <div className="market-row-name">{rod.name}</div>
                  <div className="market-row-desc">{rod.description}</div>
                  <div className="market-row-stock">+{Math.round(rod.rodBoost * 100)}% odds boost</div>
                </div>
                {owned
                  ? <span className="market-owned-badge">Owned</span>
                  : (
                    <button
                      className={`market-buy-btn${!canAfford ? ' disabled' : ''}`}
                      onClick={() => canAfford && onBuyRod(rod)}
                      disabled={!canAfford}
                    >
                      🪙 {rod.price}
                    </button>
                  )
                }
              </div>
            );
          })}

          {tab === "decos" && (
            <div className="market-did-you-know">
              💡 Did you know? Open the full-screen aquarium to drag and arrange your decorations.
            </div>
          )}

          {tab === "decos" && [...DECORATION_CATALOG].sort((a, b) => a.price - b.price).map(dec => {
            const ownedCount = ownedDecorations.filter(d => d.id === dec.id).length;
            const canAfford = goldCoins >= dec.price;
            return (
              <div key={dec.id} className="market-row">
                <img className="market-row-emoji item-art deco-thumb" src={decoImg(dec.file)} alt={dec.name} />
                <div className="market-row-info">
                  <div className="market-row-name">{dec.name}</div>
                  <div className="market-row-desc">{dec.description}</div>
                  <div className="market-row-stock">In aquarium: {ownedCount}x</div>
                </div>
                <button
                  className={`market-buy-btn${!canAfford ? ' disabled' : ''}`}
                  onClick={() => canAfford && onBuyDecoration(dec)}
                  disabled={!canAfford}
                >
                  🪙 {dec.price}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Fishing history ───────────────────────────────────────────────────────────

function timeAgo(ts) {
  if (!ts) return "unknown";
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60)  return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function HistorySheet({ catches, onClose, closing, onClosed }) {
  const sorted = [...catches].sort((a, b) => (b.caughtAt || 0) - (a.caughtAt || 0));
  return (
    <>
      <div className={`bait-sheet-backdrop${closing ? ' closing' : ''}`} onClick={onClose} />
      <div className={`bait-sheet${closing ? ' closing' : ''}`} onAnimationEnd={closing ? onClosed : undefined}>
        <div className="bait-sheet-handle" />
        <div className="bait-sheet-title">Catch History</div>
        {sorted.length === 0
          ? <div className="history-empty">No fish caught yet. Go fish!</div>
          : sorted.map((fish, i) => (
            <div key={`${fish.id}-${i}`} className="history-row">
              <img src={fish.img} alt={fish.name} className="fish-sprite history-fish-icon" />
              <div className="history-row-info">
                <span className="history-fish-name" style={{ color: RARITY_COLORS[fish.rarity] }}>{fish.name}</span>
                <span className="history-fish-rarity">{fish.rarity}</span>
              </div>
              <span className="history-time">{timeAgo(fish.caughtAt)}</span>
            </div>
          ))
        }
      </div>
    </>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function SidePanel() {
  const [catches, setCatches]           = useState(MOCK_CATCHES);
  const [inventory, setInventory]       = useState(MOCK_BAIT_INVENTORY);
  const [selectedBait, setSelectedBait] = useState(() => MOCK_BAIT_INVENTORY.find(b => b.count > 0) || MOCK_BAIT_INVENTORY[0]);
  const [showBaitMenu, setShowBaitMenu]       = useState(false);
  const [baitMenuClosing, setBaitMenuClosing] = useState(false);
  const [activeCasts, setActiveCasts]   = useState([]);
  const [catchLog, setCatchLog]         = useState([]);
  const castIdRef = useRef(0);

  // Economy & gear
  const [goldCoins, setGoldCoins]         = useState(150);
  const [equippedRod, setEquippedRod]     = useState(ROD_TYPES[0]);
  const [ownedRodIds, setOwnedRodIds]     = useState(() => new Set(["basic"]));
  const [ownedDecorations, setOwnedDecorations] = useState([]);

  const [emptyBaitToast, setEmptyBaitToast] = useState(false);

  // Market
  const [showMarket, setShowMarket] = useState(false);

  // Bag
  const [showBag, setShowBag]       = useState(false);
  const [bagClosing, setBagClosing] = useState(false);

  // History
  const [showHistory, setShowHistory]       = useState(false);
  const [historyClosing, setHistoryClosing] = useState(false);

  // Hamburger menu
  const [showHamburger, setShowHamburger] = useState(false);

  // isDark: true = dark mode, false = light mode. Initialized from system preference, persisted manually.
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const [isDark, setIsDark] = useState(systemDark);

  useEffect(() => {
    chrome.storage.local.get(['themeOverride'], ({ themeOverride: saved }) => {
      if (saved === 'dark') setIsDark(true);
      else if (saved === 'light') setIsDark(false);
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    chrome.storage.local.set({ themeOverride: isDark ? 'dark' : 'light' });
  }, [isDark]);

  const themeIcon = isDark ? '🌑' : '💡';
  const themeTitle = isDark ? 'Dark mode — click for light' : 'Light mode — click for dark';

  const baitCount = inventory.reduce((a, b) => a + b.count, 0);
  const caughtIds = new Set(catches.map(f => f.id));
  const top10 = [...catches].sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity]).slice(0, 10);
  const activeBait = inventory.find(b => b.id === selectedBait?.id) || BAIT_TYPES[0];
  const selectedBaitCount = inventory.find(b => b.id === selectedBait?.id)?.count ?? 0;

  const totalBoost = Math.min(0.9, activeBait.boost + equippedRod.rodBoost);

  useEffect(() => {
    chrome.storage.local.set({ panelCatchIds: catches.map(f => f.id) });
  }, [catches]);

  // Persist decorations so the full-screen aquarium shows the same layout.
  // decoSyncRef holds the last serialized value seen, so writes we triggered
  // don't bounce back through the storage listener and loop forever.
  const decoSyncRef = useRef(JSON.stringify(ownedDecorations));
  useEffect(() => {
    const serialized = JSON.stringify(ownedDecorations);
    if (serialized === decoSyncRef.current) return;
    decoSyncRef.current = serialized;
    chrome.storage.local.set({ panelDecorations: ownedDecorations });
  }, [ownedDecorations]);

  // Load saved decorations on mount + stay in sync with full-screen moves.
  useEffect(() => {
    chrome.storage.local.get(["panelDecorations"], ({ panelDecorations }) => {
      if (Array.isArray(panelDecorations)) {
        decoSyncRef.current = JSON.stringify(panelDecorations);
        setOwnedDecorations(panelDecorations);
      }
    });
    const onChange = (changes, area) => {
      if (area === "local" && changes.panelDecorations) {
        const next = changes.panelDecorations.newValue || [];
        const serialized = JSON.stringify(next);
        if (serialized === decoSyncRef.current) return;
        decoSyncRef.current = serialized;
        setOwnedDecorations(next);
      }
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.15) {
        setInventory(inv => inv.map(b => b.id === 'worm' ? { ...b, count: b.count + 1 } : b));
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const inventoryRef = useRef(inventory);
  inventoryRef.current = inventory;

  // Clear feed when all casts resolve
  useEffect(() => {
    if (activeCasts.length === 0) setCatchLog([]);
  }, [activeCasts.length]);

  // Clear stale fishing state when panel is closed
  useEffect(() => {
    const onVisChange = () => {
      if (document.visibilityState === 'hidden') {
        setActiveCasts([]);
        setCatchLog([]);
      }
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, []);

  function goFish() {
    const currentInv = inventoryRef.current;
    const selectedCount = currentInv.find(b => b.id === selectedBait?.id)?.count ?? 0;

    if (selectedCount === 0) {
      setEmptyBaitToast(true);
      setShowBag(true);
      setTimeout(() => setEmptyBaitToast(false), 3000);
      return;
    }


    const usedBait = currentInv.find(b => b.id === selectedBait.id);
    const newInv = currentInv.map(b => b.id === usedBait.id ? { ...b, count: b.count - 1 } : b);
    setInventory(newInv);
    inventoryRef.current = newInv;

    const boost = Math.min(0.9, usedBait.boost + equippedRod.rodBoost);
    const w = getRarityWeights(boost);
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    let rarity = "common";
    for (const [r, weight] of Object.entries(w)) {
      roll -= weight;
      if (roll <= 0) { rarity = r; break; }
    }
    const pool = ALL_FISH.filter(f => f.rarity === rarity);
    const fish = pool[Math.floor(Math.random() * pool.length)] ?? ALL_FISH[0];

    castIdRef.current += 1;
    const x = 15 + Math.random() * 60;
    const y = 15 + Math.random() * 50;
    setActiveCasts(prev => [...prev, { id: castIdRef.current, baitId: usedBait.id, fish, x, y }]);
  }

  function onBaitCaught(cast) {
    const isNew = !caughtIds.has(cast.fish.id);
    const catchEntry = { ...cast.fish, caughtAt: Date.now() };
    setCatches(prev => [catchEntry, ...prev.filter(f => f.id !== cast.fish.id)]);

    const logId = cast.id;
    setCatchLog(prev => [{ id: logId, fish: cast.fish, isNew }, ...prev].slice(0, 8));

    setTimeout(() => {
      setActiveCasts(prev => prev.filter(c => c.id !== cast.id));
    }, 800);

    setTimeout(() => {
      setCatchLog(prev => prev.filter(e => e.id !== logId));
    }, 4000);
  }

  // Market handlers
  function sellFish(fish) {
    setCatches(prev => prev.filter(f => f.id !== fish.id));
    setGoldCoins(g => g + SELL_PRICES[fish.rarity]);
  }

  function buyBait(bait, qty = 1) {
    const total = bait.price * qty;
    if (goldCoins < total) return;
    setGoldCoins(g => g - total);
    setInventory(inv => inv.map(b => b.id === bait.id ? { ...b, count: b.count + qty } : b));
  }

  function sellAllFish() {
    const total = catches.reduce((s, f) => s + SELL_PRICES[f.rarity], 0);
    setCatches([]);
    setGoldCoins(g => g + total);
  }

  function buyRod(rod) {
    if (goldCoins < rod.price || ownedRodIds.has(rod.id)) return;
    setGoldCoins(g => g - rod.price);
    setOwnedRodIds(s => new Set([...s, rod.id]));
  }

  function buyDecoration(dec) {
    if (goldCoins < dec.price) return;
    const confirmed = window.confirm(`Purchase "${dec.name}" for 🪙 ${dec.price}?`);
    if (!confirmed) return;
    setGoldCoins(g => g - dec.price);
    const xPos = 12 + ((ownedDecorations.length * 17) % 76);
    const uid = `${dec.id}_${Date.now()}`;
    setOwnedDecorations(prev => [...prev, { id: dec.id, uid, xPos }]);
  }

  function moveDecoration(uid, xPos) {
    setOwnedDecorations(prev => prev.map(d => (d.uid || d.id) === uid ? { ...d, xPos } : d));
  }

  function closeBag() { setBagClosing(true); }

  return (
    <div className="panel">
      {showMarket  && (
        <Market
          catches={catches}
          inventory={inventory}
          goldCoins={goldCoins}
          ownedRodIds={ownedRodIds}
          ownedDecorations={ownedDecorations}
          onClose={() => setShowMarket(false)}
          onSellFish={sellFish}
          onSellAllFish={sellAllFish}
          onBuyBait={buyBait}
          onBuyRod={buyRod}
          onBuyDecoration={buyDecoration}
        />
      )}
      {showBag && (
        <BagMenu
          inventory={inventory}
          selectedBait={selectedBait}
          equippedRod={equippedRod}
          ownedRodIds={ownedRodIds}
          onSelectBait={setSelectedBait}
          onSelectRod={setEquippedRod}
          onClose={closeBag}
          closing={bagClosing}
          onClosed={() => { setShowBag(false); setBagClosing(false); }}
        />
      )}
      {showHistory && (
        <HistorySheet
          catches={catches}
          onClose={() => setHistoryClosing(true)}
          closing={historyClosing}
          onClosed={() => { setShowHistory(false); setHistoryClosing(false); }}
        />
      )}
      {showBaitMenu && (
        <BaitInventory
          inventory={inventory}
          selected={selectedBait}
          onSelect={setSelectedBait}
          onClose={() => setBaitMenuClosing(true)}
          closing={baitMenuClosing}
          onClosed={() => { setShowBaitMenu(false); setBaitMenuClosing(false); }}
        />
      )}
      <header className="panel-header">
        <div className="header-brand">
          <img className="header-logo item-art" src={comboImg(equippedRod.id, activeBait.id)} alt={`${equippedRod.name} + ${activeBait.name}`} />
          <div>
            <div className="header-title">Port Fishing</div>
            <div className="header-sub">⚓ FISHER</div>
          </div>
        </div>
        <div className="header-actions">
          <div className="gold-chip">
            <span className="gold-icon">🪙</span>
            <span className="gold-num">{goldCoins}</span>
          </div>
          <button className="icon-btn market-btn" onClick={() => setShowMarket(true)} title="Market">🏪</button>
          <div className="hamburger-wrap">
            <button className="icon-btn hamburger-btn" onClick={() => setShowHamburger(h => !h)} title="Menu">☰</button>
          </div>
          <div className="bait-chip" onClick={() => setShowBaitMenu(true)}>
            <span className="bait-num">{baitCount}</span>
            <img className="bait-chip-art item-art" src={activeBait.img} alt={activeBait.name} />
            <span className="bait-label">baits</span>
          </div>
        </div>
      </header>

      {emptyBaitToast && (
        <div className="empty-bait-toast">
          <span>🪣 {activeBait.name} is out! Pick another bait.</span>
        </div>
      )}

      <div className="btn-section">
        <button
          className={`fish-btn ${baitCount === 0 || selectedBaitCount === 0 ? "empty" : ""}`}
          onClick={goFish}
        >
          <img className="fish-btn-icon item-art" src={comboImg(equippedRod.id, activeBait.id)} alt="" />
          <span className="fish-btn-label">
            {baitCount === 0 ? "No bait" : selectedBaitCount === 0 ? "Bait empty!" : "Fish!"}
          </span>
        </button>
      </div>

      <div className="aquarium-area">
        <Aquarium
          fish={top10}
          decorations={ownedDecorations.filter(d => d.visible !== false)}
          onMoveDecoration={moveDecoration}
          scale={DECO_SCALE.panel}
          maxDecorations={Infinity}
          readOnly
        />
        {activeCasts.length > 0 && (
          <FishingOverlay
            casts={activeCasts}
            catchLog={catchLog}
            onCatch={onBaitCaught}
          />
        )}
      </div>
      {showHamburger && (
        <>
          <div className="hamburger-backdrop" onClick={() => setShowHamburger(false)} />
          <div className="hamburger-dropdown">
            <button className="hamburger-item" onClick={() => { setShowBag(true); setShowHamburger(false); }}>
              <span className="hamburger-item-icon">🎒</span>
              <span className="hamburger-item-label">Loadout</span>
            </button>
            <button className="hamburger-item" onClick={() => { setShowHistory(true); setShowHamburger(false); }}>
              <span className="hamburger-item-icon">📋</span>
              <span className="hamburger-item-label">Catch History</span>
            </button>
            <button className="hamburger-item" onClick={() => { chrome.runtime.sendMessage({ type: "OPEN_AQUARIUM_WINDOW" }); setShowHamburger(false); }}>
              <span className="hamburger-item-icon">⛶</span>
              <span className="hamburger-item-label">Full-screen Aquarium</span>
            </button>
            <div className="hamburger-divider" />
            <button className="hamburger-item" onClick={() => { setIsDark(d => !d); setShowHamburger(false); }}>
              <span className="hamburger-item-icon">{themeIcon}</span>
              <span className="hamburger-item-label">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
