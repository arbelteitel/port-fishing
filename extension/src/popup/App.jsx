import { useState } from "react";
import "./popup.css";

const RARITY_COLORS = {
  common:    "#94a3b8",
  uncommon:  "#22c55e",
  rare:      "#0ea5e9",
  legendary: "#f59e0b",
};

const RARITY_GLOW = {
  common:    "rgba(148,163,184,0.25)",
  uncommon:  "rgba(34,197,94,0.3)",
  rare:      "rgba(14,165,233,0.3)",
  legendary: "rgba(245,158,11,0.35)",
};

const RARITY_RANK = { legendary: 4, rare: 3, uncommon: 2, common: 1 };

const BAIT_TYPES = [
  { id: "worm",   name: "Worm",   emoji: "🪱", rarity: "common",    boost: 0 },
  { id: "lure",   name: "Lure",   emoji: "🪝", rarity: "uncommon",  boost: 0.2 },
  { id: "golden", name: "Golden", emoji: "✨", rarity: "rare",      boost: 0.45 },
  { id: "chum",   name: "Chum",   emoji: "🌟", rarity: "legendary", boost: 0.75 },
];

const MOCK_USER = "FISHER";

const INITIAL_INVENTORY = [
  { ...BAIT_TYPES[0], count: 8 },
  { ...BAIT_TYPES[1], count: 3 },
  { ...BAIT_TYPES[2], count: 1 },
  { ...BAIT_TYPES[3], count: 0 },
];

const ALL_FISH = [
  { id: "coelacanth", name: "Coelacanth",   emoji: "🦖", rarity: "legendary", size: 32, description: "Ancient platform fish. Survives every breaking change." },
  { id: "narwhal",    name: "Narwhal",      emoji: "🦄", rarity: "legendary", size: 28, description: "Pierces through stuck queue backlogs." },
  { id: "whale",      name: "Blue Whale",   emoji: "🐋", rarity: "legendary", size: 36, description: "Swallows entire data lake migrations whole." },
  { id: "starfish",   name: "Starfish",     emoji: "⭐", rarity: "legendary", size: 24, description: "A perfect UX moment, caught at just the right time." },
  { id: "anglerfish", name: "Anglerfish",   emoji: "🔦", rarity: "rare",      size: 22, description: "Found only in the deep query optimizer." },
  { id: "manta_ray",  name: "Manta Ray",    emoji: "🦈", rarity: "rare",      size: 28, description: "Glides gracefully through complex workflows." },
  { id: "squid",      name: "Giant Squid",  emoji: "🦑", rarity: "rare",      size: 26, description: "Lurks in the lakehouse depths." },
  { id: "seahorse",   name: "Seahorse",     emoji: "🐴", rarity: "rare",      size: 18, description: "Rare sighting near polished feature releases." },
  { id: "octopus",    name: "Octopus",      emoji: "🐙", rarity: "uncommon",  size: 22, description: "Tentacles reach every external integration." },
  { id: "eel",        name: "Electric Eel", emoji: "⚡", rarity: "uncommon",  size: 18, description: "Powers the scheduler with unexpected voltage." },
  { id: "pufferfish", name: "Pufferfish",   emoji: "🐡", rarity: "uncommon",  size: 20, description: "Inflates when a component re-renders too much." },
  { id: "swordfish",  name: "Swordfish",    emoji: "🗡️", rarity: "uncommon",  size: 22, description: "Cuts through schema migrations cleanly." },
  { id: "clownfish",  name: "Clownfish",    emoji: "🐠", rarity: "common",    size: 16, description: "Lives in colorful UI components." },
  { id: "bass",       name: "Sea Bass",     emoji: "🐟", rarity: "common",    size: 18, description: "Sturdy, reliable, deeply indexed." },
  { id: "salmon",     name: "Salmon",       emoji: "🎏", rarity: "common",    size: 20, description: "Runs upstream through action pipelines." },
  { id: "anchovy",    name: "Anchovy",      emoji: "🐾", rarity: "common",    size: 14, description: "Small but vital to every data pipeline." },
];

const MOCK_CATCHES = [
  { ...ALL_FISH.find(f => f.id === "coelacanth"), caughtAt: "2026-06-20" },
  { ...ALL_FISH.find(f => f.id === "narwhal"),    caughtAt: "2026-06-19" },
  { ...ALL_FISH.find(f => f.id === "anglerfish"), caughtAt: "2026-06-18" },
  { ...ALL_FISH.find(f => f.id === "octopus"),    caughtAt: "2026-06-17" },
  { ...ALL_FISH.find(f => f.id === "clownfish"),  caughtAt: "2026-06-16" },
];

function rollFish(bait) {
  const boost = bait.boost;
  const weights = ALL_FISH.map(f => ({
    legendary: 3  + boost * 32,
    rare:      12 + boost * 28,
    uncommon:  Math.max(4, 25 - boost * 12),
    common:    Math.max(4, 60 - boost * 48),
  }[f.rarity]));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < ALL_FISH.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return ALL_FISH[i];
  }
  return ALL_FISH[ALL_FISH.length - 1];
}

function SwimmingFish({ fish, index, total }) {
  const duration = 8 + (index * 1.7) % 10;
  const delay    = -(index * 2.3) % duration;
  const topPct   = 8 + (index / total) * 70;
  const color    = RARITY_COLORS[fish.rarity];

  return (
    <div
      className="swimming-fish"
      style={{
        top: `${topPct}%`,
        fontSize: `${fish.size}px`,
        animationDuration: `${duration}s, ${duration * 0.6}s`,
        animationDelay: `${delay}s, ${delay * 0.5}s`,
        filter: `drop-shadow(0 0 6px ${color}99)`,
      }}
      title={`${fish.name} · ${fish.rarity}`}
    >
      {fish.emoji}
    </div>
  );
}

function AquariumScreen({ catches, onBack }) {
  const top10 = [...catches]
    .sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity])
    .slice(0, 10);

  return (
    <div className="aquarium-screen popup">
      <header className="aquarium-header">
        <button className="btn-back" onClick={onBack}>←</button>
        <span className="aquarium-title">🐠 Aquarium</span>
        <span className="aquarium-count">{catches.length} caught</span>
      </header>

      <div className="tank">
        <div className="water-shimmer" />
        <div className="bubbles">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bubble" style={{ left: `${8 + i * 15}%`, width: `${4 + (i % 3)}px`, height: `${4 + (i % 3)}px`, animationDelay: `${i * 0.7}s` }} />
          ))}
        </div>
        {top10.map((fish, i) => (
          <SwimmingFish key={fish.id} fish={fish} index={i} total={top10.length} />
        ))}
        <div className="seaweed" style={{ left: "8%",  height: 24, animationDelay: "0s" }} />
        <div className="seaweed" style={{ left: "50%", height: 18, animationDelay: "-1.5s" }} />
        <div className="seaweed" style={{ right: "10%", height: 28, animationDelay: "-2.5s" }} />
        <div className="tank-seabed" />
      </div>

      <div className="fish-legend">
        {top10.map(fish => (
          <div key={fish.id} className="legend-item">
            <span className="legend-emoji">{fish.emoji}</span>
            <span className="legend-name">{fish.name}</span>
            <span className={`rarity-badge ${fish.rarity}`}>{fish.rarity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultScreen({ fish, onCastAgain, onAquarium }) {
  const color = RARITY_COLORS[fish.rarity];
  const glow  = RARITY_GLOW[fish.rarity];
  const stars = "★".repeat(RARITY_RANK[fish.rarity]) + "☆".repeat(4 - RARITY_RANK[fish.rarity]);

  return (
    <div className="result-screen popup" style={{ "--rarity-color": color, "--rarity-glow": glow }}>
      <header className="result-header">
        <span style={{ fontSize: 15, fontWeight: 800, color: "#0369a1" }}>🎣 Port Fishing</span>
      </header>

      <div className="result-body">
        <div className="result-card">
          <div className="result-fish-emoji">{fish.emoji}</div>
          {fish.isNew && <div className="result-new-badge">✨ New Catch!</div>}
          <div className="result-stars">{stars}</div>
          <div className="result-rarity-tag">{fish.rarity}</div>
          <div className="result-fish-name">{fish.name}</div>
          <div className="result-fish-desc">{fish.description}</div>
        </div>

        <div className="result-footer">
          <button className="btn-go-fish" onClick={onCastAgain}>
            <span className="btn-icon">🎣</span>
            Cast Again
          </button>
          <button className="btn-secondary" onClick={onAquarium}>
            🐠 My Aquarium
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen]             = useState("main");
  const [baitInventory, setBaitInventory] = useState(INITIAL_INVENTORY);
  const [loading, setLoading]           = useState(false);
  const [catchResult, setCatchResult]   = useState(null);
  const [catches, setCatches]           = useState(MOCK_CATCHES);

  const totalBaits = baitInventory.reduce((s, b) => s + b.count, 0);

  async function goFish() {
    if (totalBaits === 0 || loading) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));

    const available = baitInventory.filter(b => b.count > 0);
    const bait = available[0];
    const fish = rollFish(bait);
    const isNew = !catches.find(c => c.id === fish.id);

    setBaitInventory(prev => prev.map(b => b.id === bait.id ? { ...b, count: b.count - 1 } : b));
    setCatches(prev => prev.find(f => f.id === fish.id) ? prev : [{ ...fish, caughtAt: new Date().toISOString() }, ...prev]);
    setLoading(false);
    setCatchResult({ ...fish, isNew });
    setScreen("result");
  }

  async function pollNow() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setBaitInventory(prev => prev.map(b => b.id === "worm" ? { ...b, count: b.count + 2 } : b));
    setLoading(false);
  }

  if (screen === "aquarium") {
    return <AquariumScreen catches={catches} onBack={() => setScreen("main")} />;
  }

  if (screen === "result" && catchResult) {
    return (
      <ResultScreen
        fish={catchResult}
        onCastAgain={() => setScreen("main")}
        onAquarium={() => setScreen("aquarium")}
      />
    );
  }

  return (
    <div className="popup">
      <header className="popup-header">
        <div className="header-brand">
          <span className="header-logo">🎣</span>
          <div>
            <div className="header-title">Port Fishing</div>
            <div className="header-sub">by Port.io</div>
          </div>
        </div>
        <div className="user-pill">⚓ {MOCK_USER}</div>
      </header>

      <div className="popup-body">
        <div className="bait-card">
          <div className="bait-main">
            <div className="bait-count-big">{totalBaits}</div>
            <div className="bait-meta">
              <div className="bait-meta-label">Baits available</div>
              <div className="bait-meta-hint">Spend one to go fishing</div>
            </div>
            <span className="bait-worm-icon">🪱</span>
          </div>
          <div className="bait-types-row">
            {baitInventory.map(b => (
              <div key={b.id} className={`bait-pill ${b.rarity}${b.count === 0 ? " empty" : ""}`}>
                {b.emoji} {b.count}
              </div>
            ))}
          </div>
        </div>

        <button className="btn-go-fish" onClick={goFish} disabled={totalBaits === 0 || loading}>
          <span className="btn-icon">🎣</span>
          {loading ? "Casting..." : totalBaits === 0 ? "No Bait" : "Go Fish!"}
        </button>

        <div className="secondary-row">
          <button className="btn-secondary" onClick={pollNow} disabled={loading}>
            ↻ Check Port activity
          </button>
          <button className="btn-secondary" onClick={() => setScreen("aquarium")}>
            🐠 Aquarium
          </button>
        </div>

        <p className="popup-hint">Merge PRs in Port.io to earn baits</p>
      </div>
    </div>
  );
}
