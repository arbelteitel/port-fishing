import { useState, useEffect, useRef, useCallback } from "react";
import "./sidepanel.css";

const RARITY_COLORS = { common: "#94a3b8", uncommon: "#22c55e", rare: "#38bdf8", legendary: "#f59e0b" };
const RARITY_GLOW   = { common: "rgba(148,163,184,0.5)", uncommon: "rgba(34,197,94,0.6)", rare: "rgba(56,189,248,0.6)", legendary: "rgba(245,158,11,0.7)" };
const RARITY_RANK   = { legendary: 4, rare: 3, uncommon: 2, common: 1 };
const sizeToSpeed = (size) => 28 / size; // whale(52)→0.54, clownfish(20)→1.4

const ALL_FISH = [
  { id: "coelacanth", name: "Coelacanth",  emoji: "🦖", rarity: "legendary", size: 44, description: "Ancient platform fish. Survives every breaking change." },
  { id: "narwhal",    name: "Narwhal",     emoji: "🦄", rarity: "legendary", size: 38, description: "Pierces through stuck queue backlogs." },
  { id: "whale",      name: "Blue Whale",  emoji: "🐋", rarity: "legendary", size: 52, description: "Swallows entire data lake migrations whole." },
  { id: "starfish",   name: "Starfish",    emoji: "⭐", rarity: "legendary", size: 32, description: "A perfect UX moment." },
  { id: "anglerfish", name: "Anglerfish",  emoji: "🔦", rarity: "rare",      size: 28, description: "Found in the deep query optimizer." },
  { id: "manta_ray",  name: "Manta Ray",   emoji: "🦈", rarity: "rare",      size: 38, description: "Glides through complex workflows." },
  { id: "squid",      name: "Giant Squid", emoji: "🦑", rarity: "rare",      size: 34, description: "Lurks in the lakehouse depths." },
  { id: "seahorse",   name: "Seahorse",    emoji: "🐴", rarity: "rare",      size: 22, description: "Rare near polished feature releases." },
  { id: "octopus",    name: "Octopus",     emoji: "🐙", rarity: "uncommon",  size: 30, description: "Tentacles reach every integration." },
  { id: "eel",        name: "Electric Eel",emoji: "⚡", rarity: "uncommon",  size: 24, description: "Powers the scheduler." },
  { id: "pufferfish", name: "Pufferfish",  emoji: "🐡", rarity: "uncommon",  size: 26, description: "Inflates on re-renders." },
  { id: "clownfish",  name: "Clownfish",   emoji: "🐠", rarity: "common",    size: 20, description: "Lives in colorful UI components." },
  { id: "bass",       name: "Sea Bass",    emoji: "🐟", rarity: "common",    size: 23, description: "Sturdy and deeply indexed." },
  { id: "salmon",     name: "Salmon",      emoji: "🎏", rarity: "common",    size: 25, description: "Runs upstream through pipelines." },
];

const MOCK_CATCHES = [
  { ...ALL_FISH.find(f => f.id === "coelacanth") },
  { ...ALL_FISH.find(f => f.id === "narwhal") },
  { ...ALL_FISH.find(f => f.id === "anglerfish") },
  { ...ALL_FISH.find(f => f.id === "octopus") },
  { ...ALL_FISH.find(f => f.id === "clownfish") },
];

// ── Physics aquarium ──────────────────────────────────────────────────────────

function Aquarium({ fish }) {
  const containerRef = useRef(null);
  const elemsRef     = useRef([]);
  const stateRef     = useRef([]);
  const rafRef       = useRef(null);

  // Init physics — only spawn state for NEW fish IDs, never reset existing ones
  const fishIds = fish.map(f => f.id).join(",");
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;

    const existingById = Object.fromEntries(stateRef.current.map(s => [s.id, s]));

    stateRef.current = fish.map((f) => {
      if (existingById[f.id]) return existingById[f.id]; // keep existing state untouched
      const spd   = sizeToSpeed(f.size);
      const angle = Math.random() * Math.PI * 2;
      return {
        id: f.id,
        x: 40 + Math.random() * (W - 80),
        y: 30 + Math.random() * (H - 80),
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        baseSpeed: spd,
        bobPhase: Math.random() * Math.PI * 2,
        wanderStrength: 0.04 + Math.random() * 0.03,
        fleeTtl: 0,
        fleeVx: 0,
        fleeVy: 0,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fishIds]);

  // RAF loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const MARGIN     = 16;
    const WALL_RANGE = 48;  // soft repulsion zone near walls
    const WALL_FORCE = 0.12;

    function tick() {
      const W = container.clientWidth;
      const H = container.clientHeight;

      stateRef.current.forEach((s, i) => {
        // 1. Sinusoidal speed cycle — gives organic rhythm
        s.bobPhase += 0.028;
        const speedMod   = 1 + Math.sin(s.bobPhase) * 0.28;
        const targetSpd  = s.baseSpeed * speedMod;

        // 2. Continuous wander: rotate velocity vector by a small random angle each frame
        //    This produces smooth curved paths instead of straight lines
        const wanderAngle = (Math.random() - 0.5) * s.wanderStrength;
        const cosW = Math.cos(wanderAngle), sinW = Math.sin(wanderAngle);
        const wvx = s.vx * cosW - s.vy * sinW;
        const wvy = s.vx * sinW + s.vy * cosW;
        s.vx = wvx;
        s.vy = wvy;

        // 3. Normalize to sinusoidal target speed
        const spd = Math.sqrt(s.vx * s.vx + s.vy * s.vy) || 1;
        s.vx = (s.vx / spd) * targetSpd;
        s.vy = (s.vy / spd) * targetSpd;

        // 4. Soft wall repulsion — fish curve away before hitting walls
        if (s.x < WALL_RANGE)     s.vx += WALL_FORCE * (1 - s.x / WALL_RANGE);
        if (s.x > W - WALL_RANGE) s.vx -= WALL_FORCE * (1 - (W - s.x) / WALL_RANGE);
        if (s.y < WALL_RANGE)     s.vy += WALL_FORCE * (1 - s.y / WALL_RANGE);
        if (s.y > H - WALL_RANGE) s.vy -= WALL_FORCE * (1 - (H - s.y) / WALL_RANGE);

        // 5. Apply and decay flee impulse
        if (s.fleeTtl > 0) {
          s.vx     += s.fleeVx;
          s.vy     += s.fleeVy;
          s.fleeVx *= 0.88;
          s.fleeVy *= 0.88;
          s.fleeTtl--;
        }

        // 6. Move
        s.x += s.vx;
        s.y += s.vy;

        // 7. Hard clamp as fallback (shouldn't be visible with soft repulsion)
        if (s.x < MARGIN)     { s.x = MARGIN;     s.vx =  Math.abs(s.vx); }
        if (s.x > W - MARGIN) { s.x = W - MARGIN; s.vx = -Math.abs(s.vx); }
        if (s.y < MARGIN)     { s.y = MARGIN;      s.vy =  Math.abs(s.vy); }
        if (s.y > H - MARGIN) { s.y = H - MARGIN;  s.vy = -Math.abs(s.vy); }

        // 8. Visual tail-wag: tiny sinusoidal y offset on top of physics
        const wagOffset = Math.sin(s.bobPhase * 1.8) * 2;

        const el = elemsRef.current[i];
        if (el) {
          el.style.left      = `${s.x}px`;
          el.style.top       = `${s.y + wagOffset}px`;
          el.style.transform = `translate(-50%,-50%) scaleX(${s.vx < 0 ? -1 : 1})`;
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

    // Ripple effect at click point
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

      // Closer = stronger impulse; farther = weaker (but always some reaction)
      const strength = Math.max(0.3, 1 - dist / diag) * s.baseSpeed * 5;
      const angle    = Math.atan2(dy, dx);
      // Store as impulse - decays over fleeTtl frames
      s.fleeVx  = Math.cos(angle) * strength * 0.25;
      s.fleeVy  = Math.sin(angle) * strength * 0.25;
      s.fleeTtl = 28;
    });
  }, []);

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
          style={{
            fontSize: `${f.size}px`,
            filter: `drop-shadow(0 0 10px ${RARITY_GLOW[f.rarity]})`,
          }}
          title={`${f.name} · ${f.rarity}`}
        >
          {f.emoji}
        </div>
      ))}

      <div className="tank-seabed">
        <div className="seaweed" style={{ left: "8%",  height: 30, animationDelay: "0s" }} />
        <div className="seaweed" style={{ left: "40%", height: 22, animationDelay: "-1.2s" }} />
        <div className="seaweed" style={{ right: "12%",height: 36, animationDelay: "-2.1s" }} />
      </div>
    </div>
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

// ── Main panel ────────────────────────────────────────────────────────────────

export default function SidePanel() {
  const [catches, setCatches]         = useState(MOCK_CATCHES);
  const [baitCount, setBaitCount]     = useState(5);
  const [casting, setCasting]         = useState(false);
  const [catchResult, setCatchResult] = useState(null);
  const [ripple, setRipple]           = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setBaitCount(c => c + (Math.random() < 0.15 ? 1 : 0));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const top10    = [...catches].sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity]).slice(0, 10);
  const caughtIds = new Set(catches.map(f => f.id));

  async function goFish() {
    if (baitCount === 0 || casting) return;
    setCasting(true);
    setRipple(true);
    setTimeout(() => setRipple(false), 700);
    await new Promise(r => setTimeout(r, 1000));

    const weights = ALL_FISH.map(f => ({ legendary: 3, rare: 12, uncommon: 25, common: 60 }[f.rarity]));
    const total   = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    let fish = ALL_FISH[ALL_FISH.length - 1];
    for (let i = 0; i < ALL_FISH.length; i++) { roll -= weights[i]; if (roll <= 0) { fish = ALL_FISH[i]; break; } }

    const isNew = !caughtIds.has(fish.id);
    setCatches(prev => prev.find(f => f.id === fish.id) ? prev : [{ ...fish }, ...prev]);
    setBaitCount(c => Math.max(0, c - 1));
    setCasting(false);
    setCatchResult({ ...fish, isNew });
  }

  return (
    <div className="panel">
      {catchResult && <CatchReveal fish={catchResult} onDismiss={() => setCatchResult(null)} />}

      <header className="panel-header">
        <div className="header-brand">
          <span className="header-logo">🎣</span>
          <div>
            <div className="header-title">Port Fishing</div>
            <div className="header-sub">⚓ FISHER</div>
          </div>
        </div>
        <div className="bait-chip">
          <span className="bait-num">{baitCount}</span>
          <span>🪱</span>
          <span className="bait-label">baits</span>
        </div>
      </header>

      <div className="btn-section">
        <button
          className={`fish-btn ${casting ? "casting" : ""} ${baitCount === 0 ? "empty" : ""} ${ripple ? "ripple" : ""}`}
          onClick={goFish}
          disabled={baitCount === 0 || casting}
        >
          <span className="fish-btn-icon">{casting ? "🌊" : "🎣"}</span>
          <span className="fish-btn-label">{casting ? "Casting…" : baitCount === 0 ? "No bait" : "Fish!"}</span>
        </button>
      </div>

      <Aquarium fish={top10} />
    </div>
  );
}
