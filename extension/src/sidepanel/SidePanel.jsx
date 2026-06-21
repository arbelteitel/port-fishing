import { useState, useEffect, useRef, useCallback } from "react";
import "./sidepanel.css";

const RARITY_COLORS = { common: "#94a3b8", uncommon: "#22c55e", rare: "#38bdf8", legendary: "#f59e0b" };
const RARITY_GLOW   = { common: "rgba(148,163,184,0.5)", uncommon: "rgba(34,197,94,0.6)", rare: "rgba(56,189,248,0.6)", legendary: "rgba(245,158,11,0.7)" };
const RARITY_RANK   = { legendary: 4, rare: 3, uncommon: 2, common: 1 };
const SELL_PRICES   = { common: 5, uncommon: 15, rare: 40, legendary: 100 };
const sizeToSpeed   = (size) => 28 / size;

// ── Bait system ───────────────────────────────────────────────────────────────

const BAIT_TYPES = [
  { id: "worm",    name: "Common Worm",    emoji: "🪱", rarity: "common",    boost: 0,    price: 5,   description: "Gets the job done. Barely." },
  { id: "lure",    name: "Shiny Lure",     emoji: "🪝", rarity: "uncommon",  boost: 0.2,  price: 20,  description: "Flashy enough to attract better fish." },
  { id: "golden",  name: "Golden Hook",    emoji: "✨", rarity: "rare",      boost: 0.45, price: 60,  description: "Rare fish find it irresistible." },
  { id: "chum",    name: "Legendary Chum", emoji: "🌟", rarity: "legendary", boost: 0.75, price: 150, description: "Dark arts. Almost guarantees something extraordinary." },
];

// ── Rod system ────────────────────────────────────────────────────────────────

const ROD_TYPES = [
  { id: "basic",  name: "Basic Rod",   emoji: "🎣", price: 0,   rodBoost: 0,    description: "A trusty rod. Gets the job done." },
  { id: "silver", name: "Silver Rod",  emoji: "🥈", price: 100, rodBoost: 0.15, description: "Better sensitivity. Improved odds." },
  { id: "golden", name: "Golden Rod",  emoji: "🏅", price: 300, rodBoost: 0.30, description: "Forged from rare catches. Serious power." },
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

const MOCK_BAIT_INVENTORY = [
  { ...BAIT_TYPES[0], count: 8 },
  { ...BAIT_TYPES[1], count: 3 },
  { ...BAIT_TYPES[2], count: 1 },
  { ...BAIT_TYPES[3], count: 0 },
];

const ALL_FISH = [
  { id: "coelacanth", name: "Coelacanth",  emoji: "🦖", rarity: "legendary", size: 58, description: "Ancient platform fish. Survives every breaking change." },
  { id: "narwhal",    name: "Narwhal",     emoji: "🦄", rarity: "legendary", size: 54, description: "Pierces through stuck queue backlogs." },
  { id: "whale",      name: "Blue Whale",  emoji: "🐋", rarity: "legendary", size: 62, description: "Swallows entire data lake migrations whole." },
  { id: "starfish",   name: "Starfish",    emoji: "⭐", rarity: "legendary", size: 50, description: "A perfect UX moment." },
  { id: "anglerfish", name: "Anglerfish",  emoji: "🔦", rarity: "rare",      size: 38, description: "Found in the deep query optimizer." },
  { id: "manta_ray",  name: "Manta Ray",   emoji: "🦈", rarity: "rare",      size: 42, description: "Glides through complex workflows." },
  { id: "squid",      name: "Giant Squid", emoji: "🦑", rarity: "rare",      size: 36, description: "Lurks in the lakehouse depths." },
  { id: "seahorse",   name: "Seahorse",    emoji: "🐴", rarity: "rare",      size: 34, description: "Rare near polished feature releases." },
  { id: "octopus",    name: "Octopus",     emoji: "🐙", rarity: "uncommon",  size: 28, description: "Tentacles reach every integration." },
  { id: "eel",        name: "Electric Eel",emoji: "⚡", rarity: "uncommon",  size: 24, description: "Powers the scheduler." },
  { id: "pufferfish", name: "Pufferfish",  emoji: "🐡", rarity: "uncommon",  size: 26, description: "Inflates on re-renders." },
  { id: "clownfish",  name: "Clownfish",   emoji: "🐠", rarity: "common",    size: 17, description: "Lives in colorful UI components." },
  { id: "bass",       name: "Sea Bass",    emoji: "🐟", rarity: "common",    size: 19, description: "Sturdy and deeply indexed." },
  { id: "salmon",     name: "Salmon",      emoji: "🎏", rarity: "common",    size: 20, description: "Runs upstream through pipelines." },
];

const MOCK_CATCHES = [
  { ...ALL_FISH.find(f => f.id === "coelacanth") },
  { ...ALL_FISH.find(f => f.id === "narwhal") },
  { ...ALL_FISH.find(f => f.id === "anglerfish") },
  { ...ALL_FISH.find(f => f.id === "octopus") },
  { ...ALL_FISH.find(f => f.id === "clownfish") },
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
      return {
        id: f.id,
        x: 40 + Math.random() * (W - 80),
        y: 30 + Math.random() * (H - 80),
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
    const MARGIN     = 16;
    const WALL_RANGE = 48;
    const WALL_FORCE = 0.12;

    function tick() {
      const W = container.clientWidth;
      const H = container.clientHeight;
      stateRef.current.forEach((s, i) => {
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
        if (s.x < WALL_RANGE)     s.vx += WALL_FORCE * (1 - s.x / WALL_RANGE);
        if (s.x > W - WALL_RANGE) s.vx -= WALL_FORCE * (1 - (W - s.x) / WALL_RANGE);
        if (s.y < WALL_RANGE)     s.vy += WALL_FORCE * (1 - s.y / WALL_RANGE);
        if (s.y > H - WALL_RANGE) s.vy -= WALL_FORCE * (1 - (H - s.y) / WALL_RANGE);
        if (s.fleeTtl > 0) {
          s.vx += s.fleeVx; s.vy += s.fleeVy;
          s.fleeVx *= 0.88; s.fleeVy *= 0.88;
          s.fleeTtl--;
        }
        s.x += s.vx; s.y += s.vy;
        if (s.x < MARGIN)     { s.x = MARGIN;     s.vx =  Math.abs(s.vx); }
        if (s.x > W - MARGIN) { s.x = W - MARGIN; s.vx = -Math.abs(s.vx); }
        if (s.y < MARGIN)     { s.y = MARGIN;      s.vy =  Math.abs(s.vy); }
        if (s.y > H - MARGIN) { s.y = H - MARGIN;  s.vy = -Math.abs(s.vy); }
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

      {fish.map((f, i) => (
        <div
          key={f.id}
          ref={el => elemsRef.current[i] = el}
          className="tank-fish"
          style={{ fontSize: `${f.size}px`, filter: `drop-shadow(0 0 10px ${RARITY_GLOW[f.rarity]})` }}
          title={`${f.name} · ${f.rarity}`}
        >
          {f.emoji}
        </div>
      ))}

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

// ── Fishing scene animation ───────────────────────────────────────────────────

function FishingScene({ boost = 0, onDone }) {
  const [phase, setPhase] = useState('cast');
  const [splashFish, setSplashFish] = useState(null);

  useEffect(() => {
    const w = getRarityWeights(boost);
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    let fish = ALL_FISH[ALL_FISH.length - 1];
    for (const f of ALL_FISH) { roll -= w[f.rarity]; if (roll <= 0) { fish = f; break; } }
    setSplashFish(fish);

    const waitMs = 1400 + Math.random() * 1800;
    const t1 = setTimeout(() => setPhase('wait'),   620);
    const t2 = setTimeout(() => setPhase('nibble'), 620 + waitMs);
    const t3 = setTimeout(() => setPhase('strike'), 620 + waitMs + 560);
    const t4 = setTimeout(() => setPhase('splash'), 620 + waitMs + 960);
    const t5 = setTimeout(() => onDone(fish),       620 + waitMs + 960 + 1300);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, []);

  const phaseLabel = {
    cast:   '🎣 Casting...',
    wait:   '⏳ Waiting...',
    nibble: "😮 Something's biting...",
    strike: '⚡ STRIKE!',
    splash: '',
  }[phase];

  const showLine = phase !== 'cast';

  return (
    <div className="fishing-scene">
      <div className="scene-sky">
        <span className="scene-moon">🌙</span>
        {[{l:10,t:9},{l:28,t:16},{l:52,t:7},{l:70,t:18},{l:20,t:28},{l:44,t:23}].map((s, i) => (
          <span key={i} className="scene-star" style={{left:`${s.l}%`,top:`${s.t}%`,animationDelay:`${i*0.38}s`}}>✦</span>
        ))}
      </div>

      <div className={`scene-water ${phase === 'strike' || phase === 'splash' ? 'choppy' : ''}`}>
        <div className="scene-wave w1" />
        <div className="scene-wave w2" />
      </div>

      <div className="scene-moon-reflect" />
      <div className={`scene-rod ${phase}`}>🎣</div>

      {showLine && (
        <svg className="scene-svg" xmlns="http://www.w3.org/2000/svg">
          <line className={`svg-fishing-line ${phase}`} x1="75%" y1="20%" x2="50%" y2="57%" />
        </svg>
      )}

      {(phase === 'wait' || phase === 'nibble') && (
        <div className={`scene-bobber ${phase}`}>
          <div className="bobber-stick" />
          <div className="bobber-ball" />
        </div>
      )}

      {phase === 'splash' && splashFish && (
        <div className="scene-splash">
          <div className="splash-ring r1" />
          <div className="splash-ring r2" />
          <div className="splash-ring r3" />
          <div className="splash-drops">
            {['-80deg','-52deg','-24deg','4deg','32deg','60deg','88deg'].map((a, i) => (
              <span key={i} className="splash-drop" style={{'--angle': a, animationDelay: `${i * 0.035}s`}}>💧</span>
            ))}
          </div>
          <div className="splash-fish">{splashFish.emoji}</div>
        </div>
      )}

      {phaseLabel && (
        <div className={`scene-label ${phase === 'strike' ? 'label-strike' : ''}`}>{phaseLabel}</div>
      )}
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
              <span className="bait-option-emoji">{bait.emoji}</span>
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
        <div className="catch-fish-emoji">{fish.emoji}</div>
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
              <span className="bag-row-icon">{equippedRod.emoji}</span>
              <div className="bag-row-info">
                <div className="bag-row-label">Rod</div>
                <div className="bag-row-name">{equippedRod.name}</div>
              </div>
              <span className="bag-row-change">Change →</span>
            </div>
            <div className="bag-row" onClick={() => setView("bait")}>
              <span className="bag-row-icon">{selectedBait.emoji}</span>
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
              <span className="bait-option-emoji">{rod.emoji}</span>
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
              <span className="bait-option-emoji">{bait.emoji}</span>
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
                  <span className="market-row-emoji">{fish.emoji}</span>
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
                <span className="market-row-emoji">{bait.emoji}</span>
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
                <span className="market-row-emoji">{rod.emoji}</span>
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
  const [fishing, setFishing]           = useState(false);
  const [catchResult, setCatchResult]   = useState(null);

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
    const id = setInterval(() => {
      if (Math.random() < 0.15) {
        setInventory(inv => inv.map(b => b.id === 'worm' ? { ...b, count: b.count + 1 } : b));
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  function goFish() {
    if (fishing || baitCount === 0) return;
    const newInv = inventory.map(b => b.id === activeBait.id ? { ...b, count: b.count - 1 } : b);
    setInventory(newInv);
    const stillHas = newInv.find(b => b.id === activeBait.id)?.count > 0;
    if (!stillHas) {
      const next = newInv.find(b => b.count > 0);
      if (next) setSelectedBait(next);
    }
    setFishing(true);
  }

  function onSceneDone(fish) {
    const isNew = !caughtIds.has(fish.id);
    setCatches(prev => prev.find(f => f.id === fish.id) ? prev : [{ ...fish }, ...prev]);
    setFishing(false);
    setCatchResult({ ...fish, isNew });
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
      {fishing     && <FishingScene boost={totalBoost} onDone={onSceneDone} />}
      {catchResult && <CatchReveal fish={catchResult} onDismiss={() => setCatchResult(null)} />}
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
          <span className="header-logo">🎣</span>
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
          <button className="icon-btn" onClick={() => setShowBag(true)} title="Loadout">🎒</button>
          <button className="icon-btn market-btn" onClick={() => setShowMarket(true)} title="Market">🏪</button>
          <div className="bait-chip" onClick={() => setShowBaitMenu(true)}>
            <span className="bait-num">{baitCount}</span>
            <span>{activeBait.emoji}</span>
            <span className="bait-label">baits</span>
          </div>
        </div>
      </header>

      <div className="btn-section">
        <button
          className={`fish-btn ${baitCount === 0 ? "empty" : ""}`}
          onClick={goFish}
          disabled={baitCount === 0 || fishing}
        >
          <span className="fish-btn-icon">🎣</span>
          <span className="fish-btn-label">{baitCount === 0 ? "No bait" : "Fish!"}</span>
        </button>
      </div>

      <Aquarium fish={top10} decorations={ownedDecorations} onMoveDecoration={moveDecoration} />
    </div>
  );
}
