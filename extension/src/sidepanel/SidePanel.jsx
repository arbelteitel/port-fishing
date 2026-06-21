import { useState, useEffect, useRef, useCallback } from "react";
import { FISH as REGISTRY_FISH } from "../lib/fish-registry.js";
import "./sidepanel.css";

const RARITY_COLORS = { common: "#94a3b8", uncommon: "#22c55e", rare: "#38bdf8", legendary: "#f59e0b" };
const RARITY_GLOW   = { common: "rgba(148,163,184,0.5)", uncommon: "rgba(34,197,94,0.6)", rare: "rgba(56,189,248,0.6)", legendary: "rgba(245,158,11,0.7)" };
const RARITY_RANK   = { legendary: 4, rare: 3, uncommon: 2, common: 1 };
const SELL_PRICES   = { common: 5, uncommon: 15, rare: 40, legendary: 100 };
const sizeToSpeed   = (size) => 22 / size;
const sizeToPx      = (size) => Math.round(size * 1.4);

// ── Item art (rods & baits live in /items) ──────────────────────────────────────
// Filenames: bait_<baitId>.png, <rodId>_rod.png, <rodId>_rod_bait_<baitId>.png
const baitImg  = (baitId)        => `/items/bait_${baitId}.png`;
const rodImg   = (rodId)         => `/items/${rodId}_rod.png`;
const comboImg = (rodId, baitId) => `/items/${rodId}_rod_bait_${baitId}.png`;

// ── Bait system ───────────────────────────────────────────────────────────────
// ids match the bait_<id>.png asset names so combo art can be resolved.

const BAIT_TYPES = [
  { id: "basic",        name: "Doughball",    img: baitImg("basic"),        rarity: "common",    boost: 0,    price: 5,   description: "Gets the job done. Barely." },
  { id: "green",        name: "Algae Pellet", img: baitImg("green"),        rarity: "common",    boost: 0.12, price: 15,  description: "Fresh and grassy. Fish nibble politely." },
  { id: "red",          name: "Salmon Roe",   img: baitImg("red"),          rarity: "uncommon",  boost: 0.22, price: 25,  description: "Bright and juicy. Hard to ignore." },
  { id: "black",        name: "Boilie",       img: baitImg("black"),        rarity: "uncommon",  boost: 0.32, price: 40,  description: "Dense and dark. Sinks to the good spots." },
  { id: "fish",         name: "Cut Bait",     img: baitImg("fish"),         rarity: "rare",      boost: 0.42, price: 65,  description: "A chunk of the real thing. Predators love it." },
  { id: "fish_black",   name: "Chum Slick",   img: baitImg("fish_black"),   rarity: "rare",      boost: 0.52, price: 95,  description: "A trail of temptation. Draws a crowd." },
  { id: "yellow_point", name: "Amber Jig",    img: baitImg("yellow_point"), rarity: "legendary", boost: 0.63, price: 135, description: "Glints like treasure. Rare fish circle in." },
  { id: "golden",       name: "Golden Lure",  img: baitImg("golden"),       rarity: "legendary", boost: 0.75, price: 185, description: "Dark arts. Almost guarantees something extraordinary." },
];

// ── Rod system ────────────────────────────────────────────────────────────────
// ids match the <id>_rod.png asset names.

const ROD_TYPES = [
  { id: "basic", name: "Basic Rod",  img: rodImg("basic"), price: 0,   rodBoost: 0,    description: "A trusty rod. Gets the job done." },
  { id: "black", name: "Carbon Rod", img: rodImg("black"), price: 120, rodBoost: 0.12, description: "Stiff and sensitive. Improved odds." },
  { id: "blue",  name: "Tidal Rod",  img: rodImg("blue"),  price: 280, rodBoost: 0.22, description: "Tuned for the deep. Serious power." },
  { id: "pink",  name: "Coral Rod",  img: rodImg("pink"),  price: 550, rodBoost: 0.35, description: "Forged from rare catches. The finest cast." },
];

// ── Decorations ───────────────────────────────────────────────────────────────

const DECORATION_CATALOG = [
  { id: "ship", name: "Sunken Ship", emoji: "🚢", price: 50, description: "A weathered ship resting on the seafloor." },
];

// ── Fish helpers ──────────────────────────────────────────────────────────────

function getRarityWeights(boost = 0) {
  return {
    common:    Math.max(4,  60 - boost * 48),
    uncommon:  Math.max(4,  25 - boost * 12),
    rare:      12 + boost * 28,
    legendary:  3 + boost * 32,
  };
}

function oddsPercent(boost) {
  const w = getRarityWeights(boost);
  const t = Object.values(w).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, Math.round(v / t * 100)]));
}

const MOCK_BAIT_INVENTORY = BAIT_TYPES.map((b, i) => ({ ...b, count: [8, 5, 3, 2, 1, 0, 0, 0][i] }));

const ALL_FISH = REGISTRY_FISH;

const MOCK_CATCHES = [
  { ...ALL_FISH.find(f => f.id === "anglerfish") },
  { ...ALL_FISH.find(f => f.id === "axolotl") },
  { ...ALL_FISH.find(f => f.id === "sunfish") },
  { ...ALL_FISH.find(f => f.id === "octopus") },
  { ...ALL_FISH.find(f => f.id === "clownfish") },
  { ...ALL_FISH.find(f => f.id === "koi") },
  { ...ALL_FISH.find(f => f.id === "pirahna") },
];

// ── Physics aquarium ──────────────────────────────────────────────────────────

function Aquarium({ fish, decorations, onMoveDecoration }) {
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
    stateRef.current = fish.map((f) => {
      if (existingById[f.id]) return existingById[f.id];
      const spd   = sizeToSpeed(f.size);
      const angle = Math.random() * Math.PI * 2;
      const vx0   = Math.cos(angle) * spd;
      const halfPx = sizeToPx(f.size) / 2;
      return {
        id: f.id,
        halfPx,
        x: 40 + Math.random() * (W - 80),
        y: 30 + Math.random() * (H - 100),
        vx: vx0,
        vy: Math.sin(angle) * spd,
        baseSpeed: spd,
        bobPhase: Math.random() * Math.PI * 2,
        wanderStrength: 0.010 + Math.random() * 0.006,
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

        {decorations.map(dec => (
          <div
            key={dec.id}
            className="tank-decoration"
            style={{ left: `${dec.xPos}%` }}
            onMouseDown={e => handleDecoDragStart(e, dec.id)}
            title={`${dec.name} — drag to reposition`}
          >
            {dec.emoji}
          </div>
        ))}
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
    <div className="fs-bob-slot">
      {phase !== 'caught' ? (
        <>
          <div className={`fs-bait-wrap ${phase}`}>
            <img className="fs-bait-sprite item-art" src={baitImg(cast.baitId)} alt="bait" />
          </div>
          <div className="fs-bait-shadow" />
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

function FishingOverlay({ casts, onCatch }) {
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
        <div className="fs-bait-row">
          {casts.map(c => (
            <BaitBob key={c.id} cast={c} onCatch={onCatch} />
          ))}
        </div>
      </div>
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

// ── Catch reveal ──────────────────────────────────────────────────────────────

function CatchReveal({ fish, onDismiss }) {
  return (
    <div className="catch-overlay" onClick={onDismiss}>
      <div className="catch-card" style={{ "--accent": RARITY_COLORS[fish.rarity], "--glow": RARITY_GLOW[fish.rarity] }} onClick={e => e.stopPropagation()}>
        <div className="catch-fish-emoji">
          <img src={fish.img} alt={fish.name} className="fish-sprite" style={{ width: sizeToPx(fish.size), height: sizeToPx(fish.size) }} />
        </div>
        {fish.isNew && <div className="catch-new-badge">✨ NEW CATCH!</div>}
        <div className="catch-rarity-stars" style={{ color: RARITY_COLORS[fish.rarity] }}>{"★".repeat(RARITY_RANK[fish.rarity])}{"☆".repeat(4 - RARITY_RANK[fish.rarity])}</div>
        <div className="catch-fish-name">{fish.name}</div>
        <div className="catch-fish-desc">{fish.description}</div>
        <button className="catch-ok-btn" onClick={onDismiss}>Awesome! 🎉</button>
      </div>
    </div>
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

function Market({ catches, inventory, goldCoins, ownedRodIds, ownedDecorations, onClose, onSellFish, onBuyBait, onBuyRod, onBuyDecoration }) {
  const [tab, setTab] = useState("fish");

  return (
    <div className="market-overlay">
      <div className="market-modal">
        <div className="market-header">
          <div className="market-title">🏪 Market</div>
          <div className="market-gold">🪙 {goldCoins}</div>
          <button className="market-close" onClick={onClose}>✕</button>
        </div>

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
              : catches.map(fish => (
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
              ))
          )}

          {tab === "baits" && BAIT_TYPES.map(bait => {
            const owned = inventory.find(b => b.id === bait.id)?.count ?? 0;
            const canAfford = goldCoins >= bait.price;
            return (
              <div key={bait.id} className="market-row">
                <img className="market-row-emoji item-art" src={bait.img} alt={bait.name} />
                <div className="market-row-info">
                  <div className="market-row-name">{bait.name}</div>
                  <div className="market-row-desc">{bait.description}</div>
                  <div className="market-row-stock">In bag: {owned}x</div>
                </div>
                <button
                  className={`market-buy-btn${!canAfford ? ' disabled' : ''}`}
                  onClick={() => canAfford && onBuyBait(bait)}
                  disabled={!canAfford}
                >
                  🪙 {bait.price}
                </button>
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

          {tab === "decos" && DECORATION_CATALOG.map(dec => {
            const owned = ownedDecorations.some(d => d.id === dec.id);
            const canAfford = goldCoins >= dec.price;
            return (
              <div key={dec.id} className="market-row">
                <span className="market-row-emoji">{dec.emoji}</span>
                <div className="market-row-info">
                  <div className="market-row-name">{dec.name}</div>
                  <div className="market-row-desc">{dec.description}</div>
                  {owned && <div className="market-row-stock">Placed in your aquarium</div>}
                </div>
                {owned
                  ? <span className="market-owned-badge">Owned</span>
                  : (
                    <button
                      className={`market-buy-btn${!canAfford ? ' disabled' : ''}`}
                      onClick={() => canAfford && onBuyDecoration(dec)}
                      disabled={!canAfford}
                    >
                      🪙 {dec.price}
                    </button>
                  )
                }
              </div>
            );
          })}
        </div>
      </div>
    </div>
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
  const [goldCoins, setGoldCoins]         = useState(120);
  const [equippedRod, setEquippedRod]     = useState(ROD_TYPES[0]);
  const [ownedRodIds, setOwnedRodIds]     = useState(() => new Set(["basic"]));
  const [ownedDecorations, setOwnedDecorations] = useState([]);

  // Market
  const [showMarket, setShowMarket] = useState(false);

  // Bag
  const [showBag, setShowBag]       = useState(false);
  const [bagClosing, setBagClosing] = useState(false);

  const baitCount = inventory.reduce((a, b) => a + b.count, 0);
  const caughtIds = new Set(catches.map(f => f.id));
  const top10 = [...catches].sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity]).slice(0, 10);
  const activeBait = inventory.find(b => b.id === selectedBait?.id && b.count > 0)
                  || inventory.find(b => b.count > 0)
                  || BAIT_TYPES[0];

  const totalBoost = Math.min(0.9, activeBait.boost + equippedRod.rodBoost);

  useEffect(() => {
    chrome.storage.local.set({ panelCatchIds: catches.map(f => f.id) });
  }, [catches]);

  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.15) {
        setInventory(inv => inv.map(b => b.id === 'worm' ? { ...b, count: b.count + 1 } : b));
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  function goFish() {
    if (baitCount === 0 || activeCasts.length >= 4) return;
    const newInv = inventory.map(b => b.id === activeBait.id ? { ...b, count: b.count - 1 } : b);
    setInventory(newInv);
    const stillHas = newInv.find(b => b.id === activeBait.id)?.count > 0;
    if (!stillHas) {
      const next = newInv.find(b => b.count > 0);
      if (next) setSelectedBait(next);
    }

    const w = getRarityWeights(totalBoost);
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
    setActiveCasts(prev => [...prev, { id: castIdRef.current, baitId: activeBait.id, fish }]);
  }

  function onBaitCaught(cast) {
    const isNew = !caughtIds.has(cast.fish.id);
    setCatches(prev => prev.find(f => f.id === cast.fish.id) ? prev : [{ ...cast.fish }, ...prev]);

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

  function buyBait(bait) {
    if (goldCoins < bait.price) return;
    setGoldCoins(g => g - bait.price);
    setInventory(inv => inv.map(b => b.id === bait.id ? { ...b, count: b.count + 1 } : b));
  }

  function buyRod(rod) {
    if (goldCoins < rod.price || ownedRodIds.has(rod.id)) return;
    setGoldCoins(g => g - rod.price);
    setOwnedRodIds(s => new Set([...s, rod.id]));
  }

  function buyDecoration(dec) {
    if (goldCoins < dec.price || ownedDecorations.some(d => d.id === dec.id)) return;
    setGoldCoins(g => g - dec.price);
    setOwnedDecorations(prev => [...prev, { ...dec, xPos: 50 }]);
  }

  function moveDecoration(id, xPos) {
    setOwnedDecorations(prev => prev.map(d => d.id === id ? { ...d, xPos } : d));
  }

  function closeBag() { setBagClosing(true); }

  return (
    <div className="panel">
      <CatchLog entries={catchLog} />
      {showMarket  && (
        <Market
          catches={catches}
          inventory={inventory}
          goldCoins={goldCoins}
          ownedRodIds={ownedRodIds}
          ownedDecorations={ownedDecorations}
          onClose={() => setShowMarket(false)}
          onSellFish={sellFish}
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
          <button className="icon-btn" onClick={() => chrome.runtime.sendMessage({ type: "OPEN_AQUARIUM_WINDOW" })} title="Full-screen aquarium">⛶</button>
          <button className="icon-btn" onClick={() => setShowBag(true)} title="Loadout">🎒</button>
          <button className="icon-btn market-btn" onClick={() => setShowMarket(true)} title="Market">🏪</button>
          <div className="bait-chip" onClick={() => setShowBaitMenu(true)}>
            <span className="bait-num">{baitCount}</span>
            <img className="bait-chip-art item-art" src={activeBait.img} alt={activeBait.name} />
            <span className="bait-label">baits</span>
          </div>
        </div>
      </header>

      <div className="btn-section">
        <button
          className={`fish-btn ${baitCount === 0 ? "empty" : ""}`}
          onClick={goFish}
          disabled={baitCount === 0 || activeCasts.length >= 4}
        >
          <img className="fish-btn-icon item-art" src={comboImg(equippedRod.id, activeBait.id)} alt="" />
          <span className="fish-btn-label">{baitCount === 0 ? "No bait" : "Fish!"}</span>
        </button>
      </div>

      {activeCasts.length > 0 && (
        <FishingOverlay
          casts={activeCasts}
          onCatch={onBaitCaught}
        />
      )}

      <Aquarium
        fish={top10}
        decorations={ownedDecorations}
        onMoveDecoration={moveDecoration}
      />
    </div>
  );
}
